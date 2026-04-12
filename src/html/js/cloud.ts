// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { RequestFirmwareLicensingMessageReply } from './types/backend-data';
import { AnfimaBackend } from './anfima-types/backend';
import { AnfimaCloud } from './anfima-types/cloud';
import { Logger } from './anfima-types/logger';
import {} from './anfima-types/globals';

const initAnfimaCloud = (): AnfimaCloud => {
    const darkglass = initDarkglassCloud();
    const modaudio = initMODAudioCloud();

    const darkglassMethods = initDarkglassCloudMethods(darkglass);
    const modaudioMethods = initMODAudioCloudMethods(modaudio);

    let licenseId = '';
    let retryNonce = true;

    const cloud: AnfimaCloud = {
        ...darkglassMethods,
        ...modaudioMethods,
        authorized: false,
        online: false,
        authorize: (backend: AnfimaBackend, logger: Logger) => {
            return new Promise<void>(async (success, reject) => {
                // retry cloud communication if we have been connected before
                const retry = retryNonce;
                retryNonce = false;

                licenseId = '';
                cloud.authorized = false;
                cloud.online = false;
                modaudio.token = '';

                let resp_fwnonce: RequestFirmwareLicensingMessageReply;

                try {
                    logger.info('Requesting device nonce...');
                    const resp_nonce = await modaudio.deviceNonce();

                    cloud.online = true;

                    logger.info('Signing device nonce...');
                    resp_fwnonce = await backend.requestFirmwareLicensing({
                        action: 'nonce',
                        message: resp_nonce.nonce,
                    });
                } catch (error) {
                    if (retry && ! cloud.online) {
                        setTimeout(() => cloud.authorize(backend, logger).then(success).catch(reject), 2000);
                        return;
                    }
                    reject(error);
                    return;
                }

                // nonce is working, set flag for retry next time
                retryNonce = true;

                try {
                    logger.info('Requesting device token...');
                    const resp_token = await modaudio.deviceToken(resp_fwnonce.payload.data.message);

                    const licenses: Array<{ id: string; uri: string; message: string; }> = [];

                    for (let info of resp_token.license_info) {
                        if (info.plugin_uri === 'urn:darkglass:pablito') {
                            licenseId = info.id;
                        } else {
                            licenses.push({ id: info.id, uri: info.plugin_uri, message: '' });
                        }
                    }

                    if (licenseId.length === 0) {
                        throw ('Unauthorized');
                    }

                    logger.info('Signing device token...');
                    const resp_fwtoken = await backend.requestFirmwareLicensing({
                        action: 'token',
                        message: resp_token.message,
                        signature: resp_token.signature,
                    });

                    cloud.authorized = true;
                    modaudio.token = resp_fwtoken.payload.data.message;

                    logger.info('Requesting device licenses...');
                    for (let license of licenses) {
                        license.message = await modaudio.license(license.id);
                    }

                    await backend.requestPluginsLicensing({
                        message: licenses.map(lic => lic.message).join(','),
                        uris: licenses.map(lic => lic.uri).join(','),
                    });

                    success();
                } catch (error) {
                    if (error === 'Unauthorized') {
                        try {
                            await backend.revokePluginLicensing();
                        } catch (_) {}
                    }

                    reject(error);
                }
            });
        },
        register: (backend: AnfimaBackend, logger: Logger) => {
            return new Promise<void>(async (success, reject) => {
                if (licenseId.length === 0) {
                    reject('Unauthorized');
                    return;
                }

                try {
                    logger.info('Request licensing...');
                    const resp = await modaudio.license(licenseId);

                    logger.info('Register license...');
                    await backend.requestFirmwareLicensing({
                        action: 'license',
                        message: resp,
                        uri: 'urn:darkglass:pablito',
                    });

                    success();
                } catch (error) {
                    reject(error);
                }
            });
        },
        reload: () => {
            return new Promise<void>(async (success, reject) => {
                try {
                    await darkglassMethods.reload();
                    await modaudioMethods.reload();
                } catch (error) {
                    reject(error);
                    return;
                }
                success();
            });
        },
    };

    return cloud;
};
