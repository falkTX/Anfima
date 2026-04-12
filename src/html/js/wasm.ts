// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { AnfimaWasmLoader, AnfimaWasmModule, Wasm } from './anfima-types/wasm';

// --------------------------------------------------------------------------------------------------------------------

const initWasm = (): Wasm => {
    const wasm: Wasm = {
        initialized: false,
        error: '',
        procfile: (_) => {
            return undefined;
        },
    };

    // early error if Web Assembly is not supported
    if (typeof(WebAssembly) === 'undefined') {
        wasm.error = 'Web Assembly is required but not supported in this browser';
        return wasm;
    }

    // Web Assembly is supported, load wasm blobs asynchronously
    // we don't need them right on start so don't block early UI interaction while loading it
    const init = async () => {
        let resp;
        try {
            resp = await fetch('/wasm/anfima.js');
            if (!resp.ok) {
                throw ('Failed to download wasm-js file');
            }
            const wasmJs = await resp.text();

            resp = await fetch('/wasm/anfima.wasm');
            if (!resp.ok) {
                throw ('Failed to download wasm-blob file');
            }
            const wasmBlob = await resp.arrayBuffer();

            const wasmJsFn = new Function(wasmJs + 'return anfima;');
            const createModule = wasmJsFn.call(undefined) as (m: AnfimaWasmLoader) => void;

            // create the wasm module and instance
            createModule({
                instantiateWasm: (imports, successCallback) => {
                    WebAssembly.instantiate(wasmBlob, imports)
                    .then(output => { successCallback(output.instance, output.module); })
                    .catch((error) => { wasm.error = '' + error; });
                    return {};
                },
                postRun: function(module: AnfimaWasmModule) {
                    const allocBuffer = (data: Uint8Array) => {
                        const ret = module._malloc(data.length);
                        for (let i = 0; i < data.length; ++i) {
                            module.HEAPU8[ret + i] = data[i];
                        }
                        return ret;
                    };
                    wasm.initialized = true;
                    wasm.procfile = (wav) => {
                        let procfile;
                        {
                            const wavBuffer = allocBuffer(wav);
                            procfile = module._procfile(wavBuffer, wav.length);
                            module._free(wavBuffer);
                        }

                        if (procfile == 0) {
                            return undefined;
                        }

                        const procfileData = module._procfile_get_data(procfile);
                        const procfileSize = module._procfile_get_size(procfile);

                        const ret = new Uint8Array(procfileSize);
                        for (let i = 0; i < procfileSize; ++i) {
                            ret[i] = module.HEAPU8[procfileData + i];
                        }

                        module._free(procfile);
                        return ret;
                    };
                },
            });
        } catch (error) {
            console.error('wasm init error: ' + error);
            wasm.error = '' + error;
        }
    };
    setTimeout(init, 1);

    return wasm;
};

// --------------------------------------------------------------------------------------------------------------------
