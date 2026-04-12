// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { DataBackend } from '../types/backend.js';
import {} from '../types/backends.js';

// --------------------------------------------------------------------------------------------------------------------

const createDataBackendWebBluetooth = () => {
    const notImplemented = () => new Promise<void>((_, reject) => reject('Not implemented in Bluetooth backend') );

    return {
        connected: false,
        connect: notImplemented,
        postMessageWithReply: notImplemented,
        postMessageWithoutReply: notImplemented,
    };
};

// --------------------------------------------------------------------------------------------------------------------
