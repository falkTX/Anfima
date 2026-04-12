// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { DataBackend, DataBackendMethods, MessageReplyTypes } from '../types/backend-data';
import { FilesBackend, FilesBackendMethods } from '../types/backend-files';

import { AnfimaBackend, Backend } from './backend';
import { AnfimaCloud, Cloud } from './cloud';
import { DarkglassCloud, DarkglassCloudMethods } from './cloud-darkglass';
import { MODAudioCloud, MODAudioCloudMethods } from './cloud-modaudio';
import { HTMLElements } from './html';
import { Logger } from './logger';
import { Wasm } from './wasm';

type pageInitArgs = (backend: Backend,
                     cloud: Cloud,
                     htmlElements: HTMLElements,
                     logger: Logger,
                     wasm: Wasm) => Promise<void>;

interface UIkitInterface {
    dropdown: (elem: HTMLElement) => {
        hide: () => void;
        show: () => void;
    };
    modal: (elem: HTMLElement) => {
        hide: () => void;
        show: () => void;
    };
}

declare global {
    // backend-data
    const kPluginLicenseFree: number;
    const kPluginLicenseTrial: number;
    const kPluginLicensePurchased: number;
    const createDataBackendDPF: () => DataBackend;
    const createDataBackendHTTP: () => DataBackend;
    const createDataBackendSimulator: () => DataBackend;
    const createDataBackendWebBluetooth: () => DataBackend;
    const createDataBackendWebHID: () => DataBackend;
    const createDataBackendWebMIDI: () => DataBackend;
    const initDataBackend: (backend: DataBackend) => DataBackendMethods;
    // backend-files
    const createFilesBackendDPF: () => FilesBackend;
    const createFilesBackendHTTP: () => FilesBackend;
    const createFilesBackendSimulator: () => FilesBackend;
    const createFilesBackendWebMIDI: () => FilesBackend;
    const createFilesBackendWebSerial: () => FilesBackend;
    const initFilesBackend: (backend: FilesBackend) => FilesBackendMethods;
    // backend
    const initAnfimaBackend: () => AnfimaBackend;
    // cloud
    const initAnfimaCloud: () => AnfimaCloud;
    // cloud-darkglass
    const initDarkglassCloud: () => DarkglassCloud;
    const initDarkglassCloudMethods: (cloud: DarkglassCloud) => DarkglassCloudMethods;
    // cloud-modaudio
    const initMODAudioCloud: () => MODAudioCloud;
    const initMODAudioCloudMethods: (cloud: MODAudioCloud) => MODAudioCloudMethods;
    // dpf
    const RunningFromDPF: boolean;
    const dpfPostInit: (() => void) | undefined;
    let dpfConnected: (() => void) | undefined;
    let dpfDisconnected: (() => void) | undefined;
    let dpfIdleIPC: (() => void) | undefined;
    let dpfIdleMessageReply: (() => void) | undefined;
    let dpfReceiveIPC: ((response: string | undefined) => void) | undefined;
    let dpfReceiveMessageReply: ((reply: MessageReplyTypes | string) => void) | undefined;
    let dpfSerialTransferData: ((data: string) => void) | undefined;
    let dpfSerialTransferDone: ((error: string | undefined) => void) | undefined;
    let dpfSerialTransferProgress: ((progress: number) => void) | undefined;
    // html
    const initHTMLElements: () => HTMLElements;
    // logger
    const initLogger: (htmlElements: HTMLElements) => Logger;
    // pages
    const initFileManager: pageInitArgs;
    const initPluginManager: pageInitArgs;
    const initPresetManager: pageInitArgs;
    const initTools: pageInitArgs;
    const initInfo: pageInitArgs;
    // resources
    const reset_user_settings: Uint8Array;
    // uikit
    const UIkit: UIkitInterface;
    // utils
    const currentDateForFilename: () => string;
    const dateToString: (date: string) => string;
    const encode: (data: string) => string;
    const sha1sum: (data: string) => string;
    const sizeToString: (size: number) => string;
    // wasm
    const initWasm: () => Wasm;
}
