// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { DataBackend } from './types/backend-data';
import { FilesBackend } from './types/backend-files';

import { AnfimaBackend } from './anfima-types/backend';
import { AnfimaCloud } from './anfima-types/cloud';
import { HTMLElements } from './anfima-types/html';
import { Logger } from './anfima-types/logger';
import { Wasm } from './anfima-types/wasm';
import {} from './anfima-types/globals';

// --------------------------------------------------------------------------------------------------------------------
// global init

document.addEventListener('DOMContentLoaded', async () => {
    const backend: AnfimaBackend = initAnfimaBackend();
    const cloud: AnfimaCloud = initAnfimaCloud();
    const htmlElements: HTMLElements = initHTMLElements();
    const logger: Logger = initLogger(htmlElements);
    const wasm: Wasm = initWasm();

    // ----------------------------------------------------------------------------------------------------------------
    // setup backend connection

    if (typeof(RunningFromDPF) !== 'undefined' && RunningFromDPF) {
        // running as native app, connect works automatically
        htmlElements.welcome.connectButton.classList.add('uk-hidden');
        logger.info('Connect Anagram to begin.');

    } else {
        // running in regular web context, connect needs user input
        htmlElements.welcome.connectButton.onclick = async () => {
            if (backend.data.connected) {
                logger.error('Already connected [ref 1]');
                return;
            }

            logger.info('Connecting...');

            try {
                await backend.data.connect();
            } catch(error) {
                logger.error('' + error);
                htmlElements.welcome.connectButton.classList.remove('uk-invisible');
                return;
            }

            dataConnected();
        };

        // show connect button if not connected after a delay, prevents flicker in case of reconnection
        setTimeout(() => {
            if (! backend.data.connected) {
                // animate button first show
                htmlElements.welcome.connectButton.classList.add('uk-hidden');
                htmlElements.welcome.connectButton.classList.add('uk-animation-fade');
                htmlElements.welcome.connectButton.classList.remove('uk-invisible');
                htmlElements.welcome.connectButton.classList.remove('uk-hidden');
            }
        }, 500);
    }

    // show simulator button if not connected after a delay, prevents flicker in case of reconnection
    setTimeout(() => {
        if (! backend.data.connected) {
            // animate button first show
            htmlElements.welcome.simulatorButton.classList.add('uk-hidden');
            htmlElements.welcome.simulatorButton.classList.add('uk-animation-fade');
            htmlElements.welcome.simulatorButton.classList.remove('uk-invisible');
            htmlElements.welcome.simulatorButton.classList.remove('uk-hidden');
        }
    }, 1000);

    // ----------------------------------------------------------------------------------------------------------------
    // setup simulator

    htmlElements.welcome.simulatorButton.onclick = () => {
        const dataSimulator = createDataBackendSimulator();
        const filesSimulator = createFilesBackendSimulator();
        for (let key of (Object.keys(dataSimulator) as Array<keyof DataBackend>)) {
            // @ts-ignore: only used for simulator so we don't care that much
            backend.data[key] = dataSimulator[key];
        }
        for (let key of (Object.keys(filesSimulator) as Array<keyof FilesBackend>)) {
            // @ts-ignore: only used for simulator so we don't care that much
            backend.files[key] = filesSimulator[key];
        }
        dataConnected();
    };

    // ----------------------------------------------------------------------------------------------------------------
    // ui navigation

    const navigateToPage = (page: string) => {
        htmlElements.navbar.pages.forEach(el => el.classList.remove('uk-active'));
        htmlElements.pages.all.forEach(el => el.classList.add('uk-hidden'));
        const liElem = document.getElementById('anfima-navbar-' + page);
        const pageElem = document.getElementById('anfima-page-' + page);
        if (liElem && pageElem) {
            liElem.classList.add('uk-active');
            pageElem.classList.remove('uk-hidden');
        } else {
            throw (`page ${ page } does not exist`);
        }
    };

    htmlElements.navbar.pages.forEach((el: HTMLElement) => {
        el.onclick = () => {
            const attrId = el.getAttribute('id');
            if (attrId) {
                const page = attrId.replace('anfima-navbar-','');
                navigateToPage(page);
            }
        };
    });

    try {
        navigateToPage(window.location.hash.slice(1));
    } catch (_) {
        navigateToPage('file-manager');
    }

    // fade-in welcome overlay
    htmlElements.welcome.overlay.classList.remove('uk-hidden');

    // ----------------------------------------------------------------------------------------------------------------
    // setup backend, after UI elements are ready

    const dataConnected = async () => {
        if (backend.data.connected) {
            throw ('Already connected [ref 2]');
        }
        backend.data.connected = true;
        htmlElements.welcome.connectButton.classList.add('uk-invisible');
        htmlElements.welcome.simulatorButton.classList.add('uk-invisible');

        // early receive for errors
        if (typeof(RunningFromDPF) !== 'undefined' && RunningFromDPF) {
            dpfReceiveIPC = (response: string | undefined) => {
                if (typeof(response) === 'string') {
                    logger.error(response);
                } else {
                    logger.error('Unexpected early response from DPF');
                }
            };
        }

        try {
            await cloud.authorize(backend, logger);
        } catch (error) {
            // ignore cloud error, optional
        }

        // early stop if disconnected during Promise await
        if (! backend.data.connected) {
            return;
        }

        try {
            await initFileManager(backend, cloud, htmlElements, logger, wasm);
            await initPluginManager(backend, cloud, htmlElements, logger, wasm);
            await initPresetManager(backend, cloud, htmlElements, logger, wasm);
            await initTools(backend, cloud, htmlElements, logger, wasm);
            await initInfo(backend, cloud, htmlElements, logger, wasm);
        } catch (error) {
            logger.error('' + error);
            backend.data.connected = false;
            htmlElements.welcome.connectButton.classList.remove('uk-invisible');
            htmlElements.welcome.simulatorButton.classList.remove('uk-invisible');
            return;
        }

        // revert our changes
        if (typeof(RunningFromDPF) !== 'undefined' && RunningFromDPF) {
            dpfReceiveIPC = undefined;
        }

        htmlElements.welcome.overlay.classList.add('uk-hidden');
        htmlElements.mainContainer.classList.remove('uk-hidden');
        htmlElements.navbar.container.classList.remove('uk-hidden');
    };

    const dataDisconnected = () => {
        if (! backend.data.connected) {
            throw ('Already disconnected');
        }
        backend.data.connected = false;
        htmlElements.welcome.connectButton.classList.remove('uk-invisible');
        htmlElements.welcome.simulatorButton.classList.remove('uk-invisible');

        htmlElements.mainContainer.classList.add('uk-hidden');
        htmlElements.navbar.container.classList.add('uk-hidden');
        htmlElements.welcome.overlay.classList.remove('uk-hidden');

        logger.useWelcomeElem();
        logger.info('Disconnected');
    };

    const filesConnected = () => {
        backend.files.connected = true;
    };

    const filesDisconnected = () => {
        backend.files.connected = false;
    };

    try {
        await backend.data.setup(() => setTimeout(dataConnected, 1), dataDisconnected);
    } catch (error) {
        logger.info('' + error);
        htmlElements.welcome.connectButton.setAttribute('disabled', '');
        htmlElements.welcome.connectButton.classList.remove('uk-button-primary');
    }

    try {
        backend.files.setup(filesConnected, filesDisconnected);
    } catch (error) {
        // logger.info('' + error);
    }

    // ----------------------------------------------------------------------------------------------------------------

    backend.postInit();
});

// --------------------------------------------------------------------------------------------------------------------
