// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { Backend } from '../anfima-types/backend';
import { Cloud } from '../anfima-types/cloud';
import { HTMLElements } from '../anfima-types/html';
import { Logger } from '../anfima-types/logger';
import {} from '../anfima-types/globals';

// --------------------------------------------------------------------------------------------------------------------

const initInfo = async (backend: Backend, cloud: Cloud, htmlElements: HTMLElements, logger: Logger) => {
    const elems = htmlElements.pages.info;

    const parseEdition = (edition: string) => {
        const split = edition.split(',');
        let ret = '';
        for (let i = 0; i < split.length; ++i) {
            if (i != 0) {
                ret += ' & ';
            }
            ret += split[i][0].toUpperCase() + split[i].slice(1);
        }
        return ret;
    };

    logger.info('Requesting device information...');

    {
        const data = (await backend.fetchFirmwareVersion()).payload.data;

        elems.buildNumber.textContent = data.version.slice(data.version.lastIndexOf('.') + 1);
        elems.version.textContent = data.version.slice(1, data.version.lastIndexOf('.'));
        elems.edition.textContent = data.edition ? parseEdition(data.edition) : 'Retail';
    }

    try {
        const resp = await backend.checkFirmwareLicensing();

        elems.deviceStatus.textContent = resp.payload.data.key === '149e897c16e874bea75961557c8fef52567ad3db'
                                       ? 'Authorized'
                                       : 'Unauthorized';
    } catch (error) {
        elems.deviceStatus.textContent = 'Failed to query status: ' + error;
        console.error(elems.deviceStatus.textContent);
    }

    elems.onlineStatus.textContent = cloud.authorized ? 'Authorized' : 'Unauthorized';
};

// --------------------------------------------------------------------------------------------------------------------
