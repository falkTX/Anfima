# Copyright (C) 2026 Filipe Coelho <falktx@falktx.com>
# SPDX-License-Identifier: ISC

# cleanup input filename
string(REPLACE "${CMAKE_CURRENT_BINARY_DIR}/html/" "" INPUT_CLEAN "${INPUT}")

# set output filename
set(OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/html-data/${INPUT_CLEAN}")

# get file length
file(SIZE "${INPUT}" INPUT_CONTENT_LEN)

# read input file
file(READ "${INPUT}" INPUT_CONTENT_HEX HEX)

# convert input file content into C hexadecimal array
string(REGEX REPLACE "([0-9a-f][0-9a-f])" "0x\\1," INPUT_CONTENT_HEX "${INPUT_CONTENT_HEX}")

# generate C-compatbile symbol based on input name
string(MAKE_C_IDENTIFIER "${INPUT_CLEAN}" INPUT_SYMBOL)
string(TOUPPER "${INPUT_SYMBOL}" INPUT_SYMBOL)

# generate C++ files
set(OUT_CPP "// auto-generated file
#include \"html-data/${INPUT_CLEAN}.h\"
const unsigned char ${INPUT_SYMBOL}_DATA[] = { ${INPUT_CONTENT_HEX} };
static_assert(sizeof(${INPUT_SYMBOL}_DATA) == ${INPUT_SYMBOL}_LEN, \"Incorrect auto-generated size\");
")

set(OUT_H "// auto-generated file
#pragma once
#define ${INPUT_SYMBOL}_LEN ${INPUT_CONTENT_LEN}
extern const unsigned char ${INPUT_SYMBOL}_DATA[];
")

file(WRITE "${OUTPUT}.cpp" "${OUT_CPP}")
file(WRITE "${OUTPUT}.h" "${OUT_H}")
