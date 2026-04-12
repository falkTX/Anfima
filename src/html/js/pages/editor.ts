// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { Backend } from '../anfima-types/backend';
import { Cloud } from '../anfima-types/cloud';
import { HTMLElements } from '../anfima-types/html';
import { Logger } from '../anfima-types/logger';
import {} from '../anfima-types/globals';

// --------------------------------------------------------------------------------------------------------------------

const initEditor = async (backend: Backend, cloud: Cloud, htmlElements: HTMLElements, logger: Logger) => {
    logger.info('Initializing editor...');

    const elems = htmlElements.pages.editor;

    if ((await backend.fetchFirmwareVersion()).payload.data.capabilities.indexOf('editor') < 0) {
        for (const page of htmlElements.pages.all) {
            if (page.id == 'anfima-page-editor') {
                page.remove();
                break;
            }
        }
        for (const page of htmlElements.navbar.pages) {
            if (page.id == 'anfima-navbar-editor') {
                page.remove();
                break;
            }
        }
    }

    const started = () => {
        elems.start.classList.add('uk-button-default', 'uk-disabled');
        elems.poll.classList.remove('uk-button-default', 'uk-disabled');
        elems.stop.classList.remove('uk-button-default', 'uk-disabled');

        elems.start.classList.remove('uk-button-primary');
        elems.poll.classList.add('uk-button-primary');
        elems.stop.classList.add('uk-button-primary');
    };

    const stopped = () => {
        elems.poll.classList.add('uk-button-default', 'uk-disabled');
        elems.stop.classList.add('uk-button-default', 'uk-disabled');
        elems.start.classList.remove('uk-button-default', 'uk-disabled');

        elems.start.classList.add('uk-button-primary');
        elems.poll.classList.remove('uk-button-primary');
        elems.stop.classList.remove('uk-button-primary');
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.poll.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        await backend.editorSend('output_data_ready');
        const data = await backend.editorPoll();

        if (data.payload.data.length !== 0) {
            elems.feedback.textContent = data.payload.data.join('\n') + '\n';
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.start.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Starting editor...');

        try {
            const reply = await backend.editorOpen();

            elems.feedback.textContent = JSON.stringify(reply.payload.state, null, '  ');

            logger.info('Editor started!');
        } catch (error) {
            logger.error(error as string);
            return;
        }

        started();
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.stop.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Closing editor...');

        try {
            await backend.editorClose();

            logger.info('Editor closed!');
        } catch (error) {
            logger.error(error as string);
        }

        stopped();
    };

    // ----------------------------------------------------------------------------------------------------------------

    stopped();
};

// --------------------------------------------------------------------------------------------------------------------
