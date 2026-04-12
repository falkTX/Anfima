// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { MessageReply } from './backend.js';

declare global {
    const RunningFromDPF: boolean;
    let dpfConnected: (() => void) | undefined;
    let dpfDisconnected: (() => void) | undefined;
    let dpfIdleIPC: (() => void) | undefined;
    let dpfIdleMessageReply: (() => void) | undefined;
    let dpfReceiveIPC: ((response: string | undefined) => void) | undefined;
    let dpfReceiveMessageReply: ((reply: MessageReply | string) => void) | undefined;
    let dpfSerialTransferDone: ((error: string | undefined) => void) | undefined;
    let dpfSerialTransferProgress: ((progress: number) => void) | undefined;
}

export {};
