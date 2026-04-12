// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

interface Logger {
    info: (message: string) => void;
    error: (message: string) => void;
    useReportElem: () => void;
    useWelcomeElem: () => void;
}

export { Logger };
