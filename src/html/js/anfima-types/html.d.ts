// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

interface HTMLElements {
    mainContainer: HTMLElement;
    navbar: {
        container: HTMLElement;
        pages: NodeListOf<HTMLElement>;
    };
    pages: {
        all: NodeListOf<HTMLElement>;
        fileManager: {
            addButton: HTMLButtonElement;
            addModal: {
                container: HTMLFormElement;
                files: HTMLElement;
            };
            filelist: HTMLElement;
            filter: HTMLElement;
            filterControls: HTMLElement;
            placeholder: HTMLElement;
            removeButton: HTMLButtonElement,
            removeModal: HTMLFormElement,
            renameModal: {
                container: HTMLFormElement;
                input: HTMLInputElement;
            };
            selectAllButton: HTMLButtonElement;
        };
        pluginManager: {
            filter: HTMLElement;
            filterControls: HTMLElement;
            grid: HTMLElement;
            infoModal: {
                container: HTMLElement;
                description: HTMLElement;
                image: HTMLImageElement;
                installButton: HTMLButtonElement;
                parameters: HTMLElement;
                removeButton: HTMLButtonElement;
            };
            installAllButton: HTMLButtonElement;
            installBundleButton: HTMLButtonElement;
            installBundleModal: {
                container: HTMLFormElement;
                input: HTMLInputElement;
            };
            moreButtonDropdown: HTMLElement;
            logOutButton: HTMLButtonElement;
            removeAllButton: HTMLButtonElement;
            signInButton: HTMLButtonElement;
            signInModal: {
                container: HTMLFormElement;
                emailInput: HTMLInputElement;
                emailLabel: HTMLLabelElement;
                passwordInput: HTMLInputElement;
                passwordLabel: HTMLLabelElement;
                status: HTMLSpanElement;
                submitButton: HTMLButtonElement;
            };
            signInStatus: HTMLElement;
            refreshButton: HTMLButtonElement;
            updateAllButton: HTMLButtonElement;
            warningModal: {
                container: HTMLFormElement;
                label: HTMLElement;
            };
        };
        presetManager: {
        };
        tools: {
            backupExport: HTMLButtonElement;
            backupImport: HTMLButtonElement;
            editSettings: HTMLButtonElement;
            editSettingsModal: {
                container: HTMLFormElement;
                keyInput: HTMLInputElement;
                valueInput: HTMLInputElement;
            };
            exportLogs: HTMLButtonElement;
            exportSettings: HTMLButtonElement;
            installUpdateFile: HTMLButtonElement;
            rebootButton: HTMLButtonElement;
            rebootRestoreButton: HTMLButtonElement;
            resetUserSettingsButton: HTMLButtonElement;
            warningModal: {
                container: HTMLFormElement;
                label: HTMLElement;
            };
        };
        info: {
            buildNumber: HTMLSpanElement;
            deviceStatus: HTMLSpanElement;
            edition: HTMLSpanElement;
            onlineStatus: HTMLSpanElement;
            version: HTMLSpanElement;
        }
    };
    reportModal: {
        container: HTMLElement;
        status: HTMLElement;
    };
    welcome: {
        connectButton: HTMLButtonElement;
        simulatorButton: HTMLButtonElement;
        overlay: HTMLElement;
        status: HTMLElement;
    };
}

export { HTMLElements };
