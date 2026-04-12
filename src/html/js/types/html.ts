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
        tools: {
            exportLogs: HTMLButtonElement;
            installUpdateFile: HTMLButtonElement;
            rebootButton: HTMLButtonElement;
            rebootRestoreButton: HTMLButtonElement;
            resetUserSettingsButton: HTMLButtonElement;
        };
    };
    reportModal: {
        container: HTMLElement;
        status: HTMLElement;
    };
    welcome: {
        connectButton: HTMLButtonElement;
        overlay: HTMLElement;
        status: HTMLElement;
    };
}

declare global {
    const initHTMLElements: () => HTMLElements;
}

export { HTMLElements };
