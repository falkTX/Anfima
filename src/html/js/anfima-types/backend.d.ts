// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { DataBackend, DataBackendMethods } from '../types/backend-data.js';
import { FilesBackend, FilesBackendMethods } from '../types/backend-files.js';

type Backend = DataBackendMethods & FilesBackendMethods;

interface AnfimaBackend extends Backend {
    data: DataBackend;
    files: FilesBackend;
    postInit: () => void;
}

export { AnfimaBackend, Backend };
