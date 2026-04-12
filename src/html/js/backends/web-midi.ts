// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { FilesBackend } from '../types/backend.js';
import {} from '../types/backends.js';

// --------------------------------------------------------------------------------------------------------------------

const createFilesBackendWebMIDI = () => {
    const notImplemented = () => new Promise<void>((_, reject) => reject('Not implemented in MIDI backend') );

    return {
        connected: false,
        connect: notImplemented,
        postMessageWithReply: notImplemented,
        postMessageWithoutReply: notImplemented,
    };
};

// --------------------------------------------------------------------------------------------------------------------
