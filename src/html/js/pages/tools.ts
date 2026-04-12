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

    elems.exportLogs.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Fetching logs...');

        try {
            const resp = await backend.exportAnagramLogs();
            if (resp.payload.err_message) {
                throw(resp.payload.err_message);
            }
            logger.info(resp.payload.message);
        } catch(error) {
            logger.error(error as string);
        }
    };

    elems.installUpdateFile.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        const input = document.createElement('input');
        input.classList.add('uk-hidden');
        input.setAttribute('accept', '.tar');
        input.setAttribute('type','file');

        input.addEventListener('cancel', (ev: Event) => {
            ev.preventDefault();
            (ev.target as HTMLInputElement).blur();

            logger.useWelcomeElem();
        });

        input.onchange = async (ev: Event) => {
            ev.preventDefault();
            (ev.target as HTMLInputElement).blur();

            if (input.files == null || input.files.length === 0) {
                logger.useWelcomeElem();
                return;
            }

            logger.info('Transferring update file...');

            try {
                const file = input.files.item(0) as File;
                const payload = new Uint8Array(await file.arrayBuffer());

                await backend.openFileReceiver({
                    dir_name: '',
                    file_name: file.name,
                    is_firmware: true,
                });
                await backend.transferSinglePayload(payload, (progress: number) => {
                    logger.info(`Transferring update file... (${progress}%)`);
                });
                await backend.firmwareTransferCompleted();
            } catch(error) {
                logger.error(error as string);
            }
        };

        input.click();

        logger.useReportElem();
        logger.info('Please select an update file from the file dialog...');
    };

    elems.rebootButton.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Rebooting unit...');

        try {
            await backend.reboot();
        } catch (error) {
            logger.error(error as string);
        }
    };

    elems.rebootRestoreButton.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Rebooting into restore...');

        try {
            await backend.firmwareTransferCompleted();
        } catch (error) {
            logger.error(error as string);
        }
    };

    elems.resetUserSettingsButton.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Resetting user settings...');

        const metadata = {
            dir_name: '',
            file_name: 'darkglass-pablito-reset-user-settings.tar',
            is_firmware: true,
        };

        try {
            await backend.openFileReceiver(metadata);
            await backend.transferSinglePayload(reset_user_settings, () => {});
            await backend.firmwareTransferCompleted();
        } catch (error) {
            logger.error(error as string);
            return;
        }
    };

    // ----------------------------------------------------------------------------------------------------------------
};

// --------------------------------------------------------------------------------------------------------------------
