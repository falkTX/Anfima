// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

interface AnfimaWasmLoader {
    instantiateWasm(
        imports: WebAssembly.Imports,
        successCallback: (instance: WebAssembly.Instance, output: WebAssembly.Module) => void,
    ): WebAssembly.Exports | undefined;
    postRun: (module: AnfimaWasmModule) => void;
}

interface AnfimaWasmModule {
    // USE_TYPED_ARRAYS == 1
    HEAP: Int32Array;
    IHEAP: Int32Array;
    FHEAP: Float64Array;

    // USE_TYPED_ARRAYS == 2
    HEAP8: Int8Array;
    HEAP16: Int16Array;
    HEAP32: Int32Array;
    HEAPU8: Uint8Array;
    HEAPU16: Uint16Array;
    HEAPU32: Uint32Array;
    HEAPF32: Float32Array;
    HEAPF64: Float64Array;
    // HEAP64: BigInt64Array;
    // HEAPU64: BigUint64Array;

    _malloc(size: number): number;
    _free(ptr: number): void;

    _procfile(data: number, dataSize: number): number;
    _procfile_get_data(procfile: number): number;
    _procfile_get_size(procfile: number): number;
}

interface Wasm {
    error: string;
    initialized: boolean;
    procfile: (wav: Uint8Array) => Uint8Array | undefined;
}

export { AnfimaWasmLoader, AnfimaWasmModule, Wasm };
