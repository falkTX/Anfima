// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

interface UIkitInterface {
    modal: (elem: HTMLElement) => {
        hide: () => void;
        show: () => void;
    };
}

declare global {
    const UIkit: UIkitInterface;
};

export {};
