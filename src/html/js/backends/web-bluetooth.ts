// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { DataBackend } from '../types/backend-data';

// --------------------------------------------------------------------------------------------------------------------

const createDataBackendWebBluetooth = (): DataBackend => {
    const notImplemented = () => new Promise<any>((_, reject) => reject('Not implemented in Bluetooth backend') );

    return {
        connected: false,
        setup: notImplemented,
        connect: notImplemented,
        postMessageWithReply: notImplemented,
        postMessageWithoutReply: notImplemented,
    };
};

// --------------------------------------------------------------------------------------------------------------------
// @anagram-comm-layer begin-exports

export { createDataBackendWebBluetooth }

// --------------------------------------------------------------------------------------------------------------------
