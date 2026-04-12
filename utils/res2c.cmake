# Copyright (C) 2026 Filipe Coelho <falktx@falktx.com>
# SPDX-License-Identifier: EUPL-1.2

# minimum javascript environment to support
set(JAVASCRIPT_TARGET es2019)

# set versions of html dependencies
set(UIKIT_VERSION 3.25.6)

# compile typescript
if("${INPUT_BASEPATH}" MATCHES "^(.*).ts$")
  if(WIN32)
    set(TSC "tsc.cmd")
  else()
    set(TSC "tsc")
  endif()

  execute_process(
    COMMAND ${TSC}
      "${INPUT_FULLPATH}"
      --target ${JAVASCRIPT_TARGET}
      --outDir "${CMAKE_CURRENT_BINARY_DIR}/html-tsc/js"
    COMMAND_ERROR_IS_FATAL
      ANY
  )

  # change file extension after compilation
  string(REGEX REPLACE "^(.*).ts$" "\\1.js" INPUT_BASEPATH "${INPUT_BASEPATH}")

  # use new compiled file instead of raw typescript
  set(INPUT_FULLPATH "${CMAKE_CURRENT_BINARY_DIR}/html-tsc/${INPUT_BASEPATH}")

  # make it web-browser compatible
  execute_process(
    COMMAND sed
      -i
      -e
      "s/export {};//"
      "${CMAKE_CURRENT_BINARY_DIR}/html-tsc/${INPUT_BASEPATH}"
    COMMAND_ERROR_IS_FATAL
      ANY
  )
endif()

# set configured filename
set(CONFIGURED_FULLPATH "${CMAKE_CURRENT_BINARY_DIR}/html/${INPUT_BASEPATH}")

# set output filename
set(OUTPUT_FULLPATH "${CMAKE_CURRENT_BINARY_DIR}/html-data/${INPUT_BASEPATH}")

# configure file into build directory
if("${INPUT_FULLPATH}" MATCHES "^(.*).(css|html|js)$")
  configure_file("${INPUT_FULLPATH}" "${CONFIGURED_FULLPATH}" @ONLY)
else()
  configure_file("${INPUT_FULLPATH}" "${CONFIGURED_FULLPATH}" COPYONLY)
endif()

# get configured file length
file(SIZE "${CONFIGURED_FULLPATH}" CONFIGURED_CONTENT_LEN)

# read configured file
file(READ "${CONFIGURED_FULLPATH}" CONFIGURED_CONTENT_HEX HEX)

# convert configured file content into C hexadecimal array
string(REGEX REPLACE "([0-9a-f][0-9a-f])" "0x\\1," CONFIGURED_CONTENT_HEX "${CONFIGURED_CONTENT_HEX}")

# generate C-compatible symbol based on input name
string(MAKE_C_IDENTIFIER "${INPUT_BASEPATH}" INPUT_SYMBOL)
string(TOUPPER "${INPUT_SYMBOL}" INPUT_SYMBOL)

# generate *.h file
file(WRITE "${OUTPUT_FULLPATH}.h" "// auto-generated file
#pragma once
#define ${INPUT_SYMBOL}_LEN ${CONFIGURED_CONTENT_LEN}
extern const unsigned char ${INPUT_SYMBOL}_DATA[];
")

# generate *.cpp file
file(WRITE "${OUTPUT_FULLPATH}.cpp" "// auto-generated file
#include \"html-data/${INPUT_BASEPATH}.h\"
const unsigned char ${INPUT_SYMBOL}_DATA[] = { ${CONFIGURED_CONTENT_HEX} };
static_assert(sizeof(${INPUT_SYMBOL}_DATA) == ${INPUT_SYMBOL}_LEN, \"Incorrect auto-generated size\");
")
