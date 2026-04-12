// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { BackendWithMethods } from '../types/backend.js';
import { HTMLElements } from '../types/html.js';
import { Logger } from '../types/logger.js';
import {} from '../types/pages.js';
import {} from '../types/resources.js';

// --------------------------------------------------------------------------------------------------------------------

const initTools = async (backend: BackendWithMethods, htmlElements: HTMLElements, logger: Logger) => {
    logger.info('Initializing tools...');

    const elems = htmlElements.pages.tools;

    // ----------------------------------------------------------------------------------------------------------------

    elems.rebootButton.onclick = (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Rebooting unit...');

        try {
            backend.reboot();
        } catch (error) {
            logger.error(error as string);
        }
    };

    elems.rebootRestoreButton.onclick = (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Rebooting into restore...');

        try {
            backend.firmwareTransferCompleted();
        } catch (error) {
            logger.error(error as string);
        }
    };

    elems.resetUserDataButton.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Resetting user data...');

        const metadata = {
            dir_name: '',
            file_name: 'darkglass-pablito-reset.tar',
            is_firmware: true,
        };

        try {
            await backend.openFileReceiver(metadata);
        } catch (error) {
            logger.error(error as string);
            return;
        }

        try {
            await backend.transferSinglePayload(reset_image_data, () => {});
        } catch (error) {
            logger.error(error as string);
            return;
        }
    };

    // ----------------------------------------------------------------------------------------------------------------
};

// --------------------------------------------------------------------------------------------------------------------
