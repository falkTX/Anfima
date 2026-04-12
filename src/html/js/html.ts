// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { HTMLElements } from './anfima-types/html';

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
    const querySelector = (name: string) => {
        const elem = document.querySelector(name);
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
                    input: getElementById('anfima-file-manager-input-rename') as HTMLInputElement,
                },
                selectAllButton: getElementById('anfima-file-manager-select-all') as HTMLButtonElement,
            },
            pluginManager: {
                filter: getElementById('anfima-plugin-manager-filter') as HTMLElement,
                filterControls: getElementById('anfima-plugin-manager-filter-controls') as HTMLElement,
                grid: getElementById('anfima-plugin-manager-grid') as HTMLElement,
                infoModal: {
                    container: getElementById('anfima-plugin-manager-info-modal') as HTMLElement,
                    description: getElementById('anfima-plugin-manager-info-modal-description') as HTMLElement,
                    image: getElementById('anfima-plugin-manager-info-modal-image') as HTMLImageElement,
                    installButton: getElementById('anfima-plugin-manager-info-modal-install') as HTMLButtonElement,
                    parameters: getElementById('anfima-plugin-manager-info-modal-parameters') as HTMLElement,
                    removeButton: getElementById('anfima-plugin-manager-info-modal-remove') as HTMLButtonElement,
                },
                installAllButton: getElementById('anfima-plugin-manager-install-all') as HTMLButtonElement,
                installBundleButton: getElementById('anfima-plugin-manager-install-bundle') as HTMLButtonElement,
                installBundleModal: {
                    container: getElementById('anfima-plugin-manager-install-bundle-modal') as HTMLFormElement,
                    input: getElementById('anfima-plugin-manager-input-bundle-id') as HTMLInputElement,
                },
                logOutButton: getElementById('anfima-plugin-manager-log-out') as HTMLButtonElement,
                moreButtonDropdown: getElementById('anfima-plugin-manager-dropdown') as HTMLButtonElement,
                removeAllButton: getElementById('anfima-plugin-manager-remove-all') as HTMLButtonElement,
                signInButton: getElementById('anfima-plugin-manager-sign-in') as HTMLButtonElement,
                signInModal: {
                    container: getElementById('anfima-plugin-manager-signin-modal') as HTMLFormElement,
                    emailInput: getElementById('anfima-plugin-manager-input-email') as HTMLInputElement,
                    emailLabel: getElementById('anfima-plugin-manager-label-email') as HTMLLabelElement,
                    passwordInput: getElementById('anfima-plugin-manager-input-password') as HTMLInputElement,
                    passwordLabel: getElementById('anfima-plugin-manager-label-password') as HTMLLabelElement,
                    status: querySelector('#anfima-plugin-manager-signin-modal span') as HTMLSpanElement,
                    submitButton: querySelector('#anfima-plugin-manager-signin-modal button[type="submit"]') as HTMLButtonElement,
                },
                signInStatus: getElementById('anfima-plugin-manager-signin-status') as HTMLElement,
                refreshButton: getElementById('anfima-plugin-manager-refresh') as HTMLButtonElement,
                updateAllButton: getElementById('anfima-plugin-manager-update-all') as HTMLButtonElement,
                warningModal: {
                    container: getElementById('anfima-plugin-manager-warning-modal') as HTMLFormElement,
                    label: querySelector('#anfima-plugin-manager-warning-modal span') as HTMLElement,
                },
            },
            presetManager: {
            },
            tools: {
                backupExport: getElementById('anfima-tools-backup-export') as HTMLButtonElement,
                backupImport: getElementById('anfima-tools-backup-import') as HTMLButtonElement,
                editSettings: getElementById('anfima-tools-settings-edit') as HTMLButtonElement,
                editSettingsModal: {
                    container: getElementById('anfima-tools-settings-edit-modal') as HTMLFormElement,
                    keyInput: getElementById('anfima-tools-settings-edit-modal-key-input') as HTMLInputElement,
                    valueInput: getElementById('anfima-tools-settings-edit-modal-value-input') as HTMLInputElement,
                },
                exportLogs: getElementById('anfima-tools-export-logs') as HTMLButtonElement,
                exportSettings: getElementById('anfima-tools-settings-export') as HTMLButtonElement,
                installUpdateFile: getElementById('anfima-tools-install-update-file') as HTMLButtonElement,
                rebootButton: getElementById('anfima-tools-reboot') as HTMLButtonElement,
                rebootRestoreButton: getElementById('anfima-tools-reboot-restore') as HTMLButtonElement,
                resetUserSettingsButton: getElementById('anfima-tools-reset-user-settings') as HTMLButtonElement,
                warningModal: {
                    container: getElementById('anfima-tools-warning-modal') as HTMLFormElement,
                    label: querySelector('#anfima-tools-warning-modal span') as HTMLElement,
                },
            },
            info: {
                buildNumber: getElementById('anfima-info-build-number') as HTMLSpanElement,
                deviceStatus: getElementById('anfima-info-device-status') as HTMLSpanElement,
                edition: getElementById('anfima-info-edition') as HTMLSpanElement,
                onlineStatus: getElementById('anfima-info-online-status') as HTMLSpanElement,
                version: getElementById('anfima-info-version') as HTMLSpanElement,
            },
        },
        reportModal: {
            container: reportModalContainer,
            status: reportModalContainer.children[0].children[0].children[0] as HTMLElement,
        },
        welcome: {
            connectButton: getElementById('anfima-connect') as HTMLButtonElement,
            simulatorButton: getElementById('anfima-simulator') as HTMLButtonElement,
            overlay: getElementById('anfima-welcome-overlay') as HTMLElement,
            status: welcomeStatus,
        },
    };

    return htmlElements;
};
