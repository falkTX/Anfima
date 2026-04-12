// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { BackendWithMethods } from './backend.js';
import { HTMLElements } from './html.js';
import { Logger } from './logger.js';

declare global {
    const initFileManager: (backend: BackendWithMethods, htmlElements: HTMLElements, logger: Logger) => Promise<void>;
    const initTools: (backend: BackendWithMethods, htmlElements: HTMLElements, logger: Logger) => Promise<void>;
}

export {};
