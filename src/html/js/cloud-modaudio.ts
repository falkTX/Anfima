// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import {
    Bundle,
    BundleFile,
    DeviceNonce,
    DeviceToken,
    MODAudioCloud,
    MODAudioCloudMethods,
    Plugin,
} from './anfima-types/cloud-modaudio';

const initMODAudioCloud = (): MODAudioCloud => {
    const MOD_API = 'https://api.mod.audio/v2';

    const cloud: MODAudioCloud = {
        token: '',
        deviceNonce: () => {
            return new Promise<DeviceNonce>(async (success, reject) => {
                try {
                    const resp = await fetch(`${ MOD_API}/devices/nonce`);
                    const json = await resp.json() as DeviceNonce;
                    if (typeof(json.nonce) !== 'string' || json.nonce.length !== 24) {
                        reject('Invalid nonce');
                        return;
                    }
                    success(json);
                } catch (error) {
                    reject(error);
                }
            });
        },
        deviceToken: (message: string) => {
            return new Promise<DeviceToken>(async (success, reject) => {
                try {
                    const resp = await fetch(`${ MOD_API}/devices/tokens`, {
                        body: JSON.stringify({ message }),
                        method: 'POST',
                    });
                    const json = await resp.json() as DeviceToken;
                    if (typeof(json.license_info) !== 'object') {
                        reject('Invalid token info');
                        return;
                    }
                    if (typeof(json.message) !== 'string') {
                        reject('Invalid token message');
                        return;
                    }
                    if (typeof(json.signature) !== 'string') {
                        reject('Invalid token signature');
                        return;
                    }
                    if (json.platform !== 'pablito') {
                        reject('Invalid token platform');
                        return;
                    }
                    success(json);
                } catch (error) {
                    reject(error);
                }
            });
        },
        license: (id: string) => {
            return new Promise<string>(async (success, reject) => {
                if (cloud.token.length === 0) {
                    reject('Unauthorized');
                    return;
                }
                try {
                    const resp = await fetch(`${ MOD_API}/licenses/${ id }`, {
                        headers: {
                            Authorization: 'MOD ' + cloud.token,
                        },
                    });
                    const blob = await resp.blob();
                    const text = await blob.text();
                    success(text);
                } catch (error) {
                    reject(error);
                }
            });
        },
        lv2Bundle: (id: string) => {
            return new Promise<Bundle>(async (success, reject) => {
                try {
                    const resp = await fetch(`${ MOD_API}/lv2/bundles/${ id }`);
                    const json = await resp.json() as Bundle;
                    if (typeof(json.files) !== 'object') {
                        reject('Invalid bundle');
                        return;
                    }
                    for (let file of json.files) {
                        if (file.platform === 'pablito') {
                            success(json);
                            return;
                        }
                    }
                    reject('Bundle does not support Anagram');
                } catch (error) {
                    reject(error);
                }
            });
        },
        lv2Plugins: () => {
            return new Promise<Array<Plugin>>(async (success, reject) => {
                try {
                    const resp = await fetch(`${ MOD_API}/lv2/plugins?image_version=1.15.0&platform=pablito`);
                    const array = await resp.json() as Array<Plugin>;
                    if (typeof(array) !== 'object') {
                        reject('MOD Audio Server Error, plugin query returned invalid object');
                        return;
                    }
                    success(array);
                } catch (error) {
                    reject(error);
                }
            });
        },
    };
    return cloud;
};

const initMODAudioCloudMethods = (cloud: MODAudioCloud): MODAudioCloudMethods => {
    const plugins: { [index: string]: Plugin } = {};
    let connected = false;

    return {
        fetchBundleById: (id: string) => {
            return new Promise<BundleFile>(async (success, reject) => {
                try {
                    const bundle = await cloud.lv2Bundle(id);

                    let file_href: string = '';
                    for (let file of bundle.files) {
                        if (file.platform === 'pablito') {
                            file_href = file.file_href;
                            break;
                        }
                    }

                    if (file_href.length === 0) {
                        reject('Bundle does not support Anagram');
                        return;
                    }

                    const resp = await fetch(file_href, {
                        headers: {
                            Authorization: 'MOD ' + cloud.token,
                        },
                    });

                    const blob = new Uint8Array(await resp.arrayBuffer());
                    const signature = resp.headers.get('x-signature') as string;

                    if (typeof(signature) !== 'string' || signature.length === 0) {
                        reject('Invalid signature');
                        return;
                    }

                    success({
                        blob,
                        name: bundle.name,
                        signature,
                    });
                } catch (error) {
                    reject(error);
                }
            });
        },
        getPluginFromMOD: (uri: string) => {
            if (! connected) {
                return undefined;
            }

            const details = plugins[uri];
            if (typeof(details) === 'undefined') {
                return undefined;
            }

            return details;
        },
        reload: () => {
            return new Promise<void>(async (success, reject) => {
                connected = false;
                // for (let key of Object.keys(plugins)) {
                //     delete plugins[key];
                // }

                try {
                    const array = await cloud.lv2Plugins();

                    for (let plugin of array) {
                        plugins[plugin.uri] = plugin;
                    }
                } catch (error) {
                    reject(error);
                    return;
                }

                connected = true;
                success();
            });
        },
    };
};
