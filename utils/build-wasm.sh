#!/bin/bash
# Copyright (C) 2026 Filipe Coelho <falktx@falktx.com>
# SPDX-License-Identifier: EUPL-1.2

set -eu

cd $(dirname "${0}")/..

CMAKE_COMMAND="${1}"
CMAKE_CURRENT_BINARY_DIR="${2}"
CMAKE_BUILD_TOOL="${3}"
CMAKE_BUILD_TYPE="${4}"

# make emscripten quiet
export EMSDK_QUIET=1

# use a known good emscripten version
EMSDK_VERSION=3.1.27

# setup emscripten
if [ ! -e "deps/emsdk/upstream/bin" ]; then
    # --build="${CMAKE_BUILD_TYPE}"
    echo "Installing emsdk..."
    ./deps/emsdk/emsdk install --generator="${CMAKE_BUILD_TOOL}" ${EMSDK_VERSION}
    echo "Activating emsdk..."
    ./deps/emsdk/emsdk activate ${EMSDK_VERSION}
fi

# activate emscripten environment
source "${PWD}/deps/emsdk/emsdk_env.sh"

# ensure output dir exists before compiling
mkdir -p "${CMAKE_CURRENT_BINARY_DIR}/html/wasm"

echo "Generating wasm..."
exec em++ src/anfima-wasm.cpp \
    -o "${CMAKE_CURRENT_BINARY_DIR}/html/wasm/anfima.js" \
    -I deps/json/include \
    -I deps/speexdsp/include \
    -ffast-math -fno-finite-math-only -fdata-sections -ffunction-sections -fvisibility=hidden \
    -DNDEBUG \
    -O3 \
    -Wl,--gc-sections \
    -sAGGRESSIVE_VARIABLE_ELIMINATION=1 \
    -sALLOW_MEMORY_GROWTH \
    -sENVIRONMENT=web \
    -sEXPORT_NAME="anfima" \
    -sEXPORTED_FUNCTIONS="['_malloc','_free']" \
    -sLLD_REPORT_UNDEFINED \
    -sMAIN_MODULE=2 \
    -sMODULARIZE=1

# other possible flags
# -sASSERTIONS=1
# -sEXPORTED_RUNTIME_METHODS=['addFunction','lengthBytesUTF8','stringToUTF8','UTF8ToString']
# -sINITIAL_MEMORY=32Mb
# -sSTACK_SIZE=4MB
# -msse -msse2 -msse3 -msimd128
