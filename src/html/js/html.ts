// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { HTMLElements } from './types/html.js';

// --------------------------------------------------------------------------------------------------------------------

const initHTMLElements = (): HTMLElements => {
    const welcomeStatus = document.getElementById('anfima-welcome-status');
    if (!welcomeStatus) {
        throw('missing html element: anfima-welcome-status');
    }

    const getElementById = (name: string) => {
        const elem = document.getElementById(name);
        if (!elem) {
            welcomeStatus.textContent = 'missing html element: ' + name;
            throw(welcomeStatus.textContent);
        }
        return elem;
    }
    const querySelectorAll = (name: string) => {
        const elems = document.querySelectorAll(name);
        if (!elems) {
            welcomeStatus.textContent = 'missing html elements: ' + name;
            throw(welcomeStatus.textContent);
        }
        return elems;
    }

    const reportModalContainer = getElementById('anfima-modal-report');

    const htmlElements: HTMLElements = {
        mainContainer: getElementById('anfima-main-container') as HTMLElement,
        navbar: {
            container: getElementById('anfima-navbar') as HTMLElement,
            pages: querySelectorAll('.anfima-navbar-page') as NodeListOf<HTMLElement>,
        },
        pages: {
            all: querySelectorAll('.anfima-page') as NodeListOf<HTMLElement>,
            fileManager: {
                addButton: getElementById('anfima-file-manager-add') as HTMLButtonElement,
                addModal: {
                    container: getElementById('anfima-file-manager-add-modal') as HTMLFormElement,
                    files: getElementById('anfima-file-manager-add-modal-files') as HTMLElement,
                },
                filelist: getElementById('anfima-file-manager-filelist') as HTMLElement,
                filter: getElementById('anfima-file-manager-filter') as HTMLElement,
                filterControls: getElementById('anfima-file-manager-filter-controls') as HTMLElement,
                placeholder: getElementById('anfima-file-manager-placeholder') as HTMLElement,
                removeButton: getElementById('anfima-file-manager-remove') as HTMLButtonElement,
                removeModal: getElementById('anfima-file-manager-remove-modal') as HTMLFormElement,
                renameModal: {
                    container: getElementById('anfima-file-manager-rename-modal') as HTMLFormElement,
                    input: document.querySelector('#anfima-file-manager-rename-modal input.uk-input') as HTMLInputElement,
                },
                selectAllButton: getElementById('anfima-file-manager-select-all') as HTMLButtonElement,
            },
            tools: {
                exportLogs: document.getElementById('anfima-tools-export-logs') as HTMLButtonElement,
                installUpdateFile: document.getElementById('anfima-tools-install-update-file') as HTMLButtonElement,
                rebootButton: getElementById('anfima-tools-reboot') as HTMLButtonElement,
                rebootRestoreButton: getElementById('anfima-tools-reboot-restore') as HTMLButtonElement,
                resetUserSettingsButton: getElementById('anfima-tools-reset-user-settings') as HTMLButtonElement,
            },
        },
        reportModal: {
            container: reportModalContainer,
            status: reportModalContainer.children[0].children[0].children[0] as HTMLElement,
        },
        welcome: {
            connectButton: getElementById('anfima-connect') as HTMLButtonElement,
            overlay: getElementById('anfima-welcome-overlay') as HTMLElement,
            status: welcomeStatus,
        },
    };

    return htmlElements;
};
