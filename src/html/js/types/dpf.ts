// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { MessageReply } from './backend.js';

declare global {
    const RunningFromDPF: boolean;
    let dpfConnected: (() => void) | undefined;
    let dpfDisconnected: (() => void) | undefined;
    let dpfIdle: (() => void) | undefined;
    let dpfReceive: ((response: MessageReply | string | undefined) => void) | undefined;
    let dpfSerialTransferDone: ((error: string | undefined) => void) | undefined;
    let dpfSerialTransferProgress: ((progress: number) => void) | undefined;
}

export {};
