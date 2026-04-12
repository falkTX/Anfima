// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { BackendWithMethods, MessageReply } from './types/backend.js';
import { HTMLElements } from './types/html.js';
import { Logger } from './types/logger.js';
import {} from './types/dpf.js';
import {} from './types/pages.js';

// --------------------------------------------------------------------------------------------------------------------
// global init

document.addEventListener('DOMContentLoaded', () => {
    const backend: BackendWithMethods = initBackend();
    const htmlElements: HTMLElements = initHTMLElements();
    const logger: Logger = initLogger(htmlElements);

    const connected = async () => {
        backend.data.connected = true;

        try {
            const version = await backend.fetchFirmwareVersion();
            console.log(version);
        } catch(error) {
            logger.error(error as string);
            return;
        }

        try {
            await initFileManager(backend, htmlElements, logger);
        } catch(error) {
            logger.error(error as string);
            return;
        }

        try {
            await initTools(backend, htmlElements, logger);
        } catch(error) {
            logger.error(error as string);
            return;
        }

        htmlElements.welcome.overlay.classList.add('uk-hidden');
        htmlElements.mainContainer.classList.remove('uk-hidden');
        htmlElements.navbar.container.classList.remove('uk-hidden');
    };

    const disconnected = () => {
        backend.data.connected = false;

        htmlElements.mainContainer.classList.add('uk-hidden');
        htmlElements.navbar.container.classList.add('uk-hidden');
        htmlElements.welcome.overlay.classList.remove('uk-hidden');

        logger.useWelcomeElem();
        logger.info('Disconnected');
    };

    htmlElements.welcome.overlay.classList.remove('uk-invisible');

    if (typeof(RunningFromDPF) !== 'undefined' && RunningFromDPF) {
        // running through DPF, expose functions globally
        dpfConnected = () => { setTimeout(connected, 0) };
        dpfDisconnected = () => { setTimeout(disconnected, 0) };

        // early receive for errors
        dpfReceiveIPC = (response: string | undefined) => {
            if (typeof(response) === 'string') {
                logger.error(response);
            } else {
                logger.error('Unexpected early response from DPF');
            }
        };

        // hide connect button, unwanted
        // htmlElements.welcome.connectButton.classList.add('uk-invisible');
        logger.info('Connect Anagram to begin.');

    } else if (window.location.hash === '#debug') {
        connected();

    } else {
        // htmlElements.welcome.connectButton.removeAttribute('disabled');
        htmlElements.welcome.connectButton.classList.remove('uk-invisible');

        // running in regular web context, connect needs user input
        htmlElements.welcome.connectButton.onclick = async () => {
            logger.info('Connecting...');

            try {
                await backend.data.connect(connected, disconnected);
            } catch(error) {
                logger.error(error as string);
                return;
            }

            connected();
        };
    }

    // ui navigation
    const navigateToPage = (page: string) => {
        htmlElements.navbar.pages.forEach(el => el.classList.remove('uk-active'));
        htmlElements.pages.all.forEach(el => el.classList.add('uk-hidden'));
        (document.getElementById('anfima-navbar-' + page) as HTMLElement).classList.add('uk-active');
        (document.getElementById('anfima-page-' + page) as HTMLElement).classList.remove('uk-hidden');
    };

    htmlElements.navbar.pages.forEach((el: HTMLElement) => {
        el.onclick = () => {
            const page: string = (el.getAttribute('id') as string).replace('anfima-navbar-','');
            navigateToPage(page);
        };
    });

    navigateToPage('file-manager');

    backend.postInit();
});

// --------------------------------------------------------------------------------------------------------------------
