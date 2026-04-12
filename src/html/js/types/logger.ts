// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { HTMLElements } from './html.js';

interface Logger {
    info: (message: string) => void;
    error: (message: string) => void;
    useReportElem: () => void;
    useWelcomeElem: () => void;
}

declare global {
    const initLogger: (htmlElements: HTMLElements) => Logger;
}

export { Logger };
