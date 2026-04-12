# Copyright (C) 2026 Filipe Coelho <falktx@falktx.com>
# SPDX-License-Identifier: EUPL-1.2

cmake_minimum_required(VERSION 3.15)
project(anfima LANGUAGES C CXX VERSION 0.0.1)

#######################################################################################################################
# cmake setup

set(CMAKE_POLICY_DEFAULT_CMP0025 NEW)
set(CMAKE_POLICY_DEFAULT_CMP0063 NEW)
set(CMAKE_POLICY_DEFAULT_CMP0069 NEW)
set(CMAKE_POLICY_DEFAULT_CMP0126 NEW)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

set(CMAKE_C_VISIBILITY_PRESET hidden)
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_VISIBILITY_INLINES_HIDDEN TRUE)

#######################################################################################################################
# hidapi setup

set(BUILD_SHARED_LIBS OFF)
set(HIDAPI_INSTALL_TARGETS OFF)

if(CMAKE_SYSTEM_NAME MATCHES "Linux")
  set(HIDAPI_WITH_HIDRAW ON)
  set(HIDAPI_WITH_LIBUSB OFF)
endif()

#######################################################################################################################
# dependencies

find_package(Threads REQUIRED)

add_subdirectory(deps/bittyhttp)
add_subdirectory(deps/dpf)
add_subdirectory(deps/hidapi)
add_subdirectory(deps/libfios)

#######################################################################################################################
# setup anfima-webserver (static lib; common dep)

add_library(anfima-webserver STATIC)

set_target_properties(anfima-webserver
  PROPERTIES
    POSITION_INDEPENDENT_CODE ON
)

target_compile_definitions(anfima-webserver
  PRIVATE
    DOCVER="${CMAKE_PROJECT_VERSION}"
    # $<$<BOOL:${WIN32}>:-D_WIN32_WINNT=0x0A00>
)

target_include_directories(anfima-webserver
  PRIVATE
    deps/dpf/distrho
    src
    ${CMAKE_CURRENT_BINARY_DIR}
)

target_link_libraries(anfima-webserver
  PRIVATE
    bittyhttp::interface
    $<$<BOOL:${WIN32}>:cfgmgr32>
    $<$<BOOL:${WIN32}>:winmm>
)

target_sources(anfima-webserver
  PRIVATE
    src/anfima-webserver.cpp
)

#######################################################################################################################
# setup anfima (main executable)

dpf_add_executable(anfima
  UI_TYPE external
  USE_FILE_BROWSER
  USE_WEB_VIEW
)

set_target_properties(anfima
  PROPERTIES
    POSITION_INDEPENDENT_CODE ON
)

target_include_directories(anfima
  PRIVATE
    src
)

target_link_libraries(anfima
  PRIVATE
    anfima-webserver
    hidapi::hidapi
    libfios::interface
    $<$<BOOL:${WIN32}>:winmm>
    ${CMAKE_THREAD_LIBS_INIT}
)

target_sources(anfima
  PRIVATE
    src/anfima.cpp
    src/anfima-hid.cpp
    src/anfima-serial.cpp
)

#######################################################################################################################
# setup webserver (extra executable, useful for testing)

dpf_add_executable(webserver
  UI_TYPE none
)

set_target_properties(webserver
  PROPERTIES
    POSITION_INDEPENDENT_CODE ON
)

target_include_directories(webserver
  PRIVATE
    src
)

target_link_libraries(webserver
  PRIVATE
    anfima-webserver
)

target_sources(webserver
  PRIVATE
    src/webserver.cpp
)

#######################################################################################################################
# TESTING

# find_package(PkgConfig REQUIRED)

# pkg_check_modules(webkit2gtk "webkit2gtk-4.1" IMPORTED_TARGET REQUIRED)
# target_compile_definitions(dgl-external
#   PRIVATE
#     WEB_VIEW_INCLUDE_GTK3_EXPLICITLY
# )
# target_link_libraries(dgl-external
#   PRIVATE
#     PkgConfig::webkit2gtk
# )

# pkg_check_modules(Qt5WebEngineWidgets "Qt5WebEngineWidgets" IMPORTED_TARGET REQUIRED)
# target_compile_definitions(dgl-external
#   PRIVATE
#     WEB_VIEW_INCLUDE_QTx_EXPLICITLY
# )
# target_link_libraries(dgl-external
#   PRIVATE
#     PkgConfig::Qt5WebEngineWidgets
# )

# pkg_check_modules(Qt6WebEngineWidgets "Qt6WebEngineWidgets" IMPORTED_TARGET REQUIRED)
# target_compile_definitions(dgl-external
#   PRIVATE
#     WEB_VIEW_INCLUDE_QTx_EXPLICITLY
# )
# target_link_libraries(dgl-external
#   PRIVATE
#     PkgConfig::Qt6WebEngineWidgets
# )

#######################################################################################################################
# setup resources

file(GLOB
  ANFIMA_RESOURCE_DEPS
    CONFIGURE_DEPENDS
    src/html/js/types/*.ts
)

function(anfima_resource FILENAME)
  if("${FILENAME}" MATCHES "^(.*)\.ts$")
    string(REGEX REPLACE "^(.*)\.ts$" "\\1.js" OUT_FILENAME "${FILENAME}")
  else()
    set(OUT_FILENAME "${FILENAME}")
  endif()

  add_custom_command(
    OUTPUT
      ${CMAKE_CURRENT_BINARY_DIR}/html-data/${OUT_FILENAME}.cpp
      ${CMAKE_CURRENT_BINARY_DIR}/html-data/${OUT_FILENAME}.h
    COMMAND ${CMAKE_COMMAND}
      -D INPUT_BASEPATH=${FILENAME}
      -D INPUT_FULLPATH=${CMAKE_CURRENT_SOURCE_DIR}/src/html/${FILENAME}
      -D VERSION=${CMAKE_PROJECT_VERSION}
      -P ${CMAKE_SOURCE_DIR}/utils/res2c.cmake
    DEPENDS
      src/html/${FILENAME}
      ${ANFIMA_RESOURCE_DEPS}
      ${CMAKE_SOURCE_DIR}/utils/res2c.cmake
    VERBATIM
  )

  target_sources(anfima-webserver
    PRIVATE
      ${CMAKE_CURRENT_BINARY_DIR}/html-data/${OUT_FILENAME}.cpp
      ${CMAKE_CURRENT_BINARY_DIR}/html-data/${OUT_FILENAME}.h
  )
endfunction()

#######################################################################################################################

anfima_resource(index.html)
anfima_resource(js/anfima.ts)
anfima_resource(js/backend.ts)
anfima_resource(js/constants.ts)
anfima_resource(js/html.ts)
anfima_resource(js/logger.ts)
anfima_resource(js/utils.ts)
anfima_resource(js/backends/dpf.ts)
anfima_resource(js/backends/dummy.ts)
anfima_resource(js/backends/web-bluetooth.ts)
anfima_resource(js/backends/web-hid.ts)
anfima_resource(js/backends/web-midi.ts)
anfima_resource(js/backends/web-serial.ts)
anfima_resource(js/pages/file-manager.ts)
anfima_resource(js/pages/tools.ts)
anfima_resource(js/resources/reset-user-settings.ts)
# anfima_resource(resources/anagram.mp4)
anfima_resource(uikit/uikit-css.min.css)
anfima_resource(uikit/uikit-icons.min.js)
anfima_resource(uikit/uikit-js.min.js)

#######################################################################################################################
# OS-specific integration

if(APPLE)
  set(APP_BUNDLE "${PROJECT_BINARY_DIR}/bin/Anfima.app")
  set_target_properties(anfima
    PROPERTIES
      RUNTIME_OUTPUT_DIRECTORY "${APP_BUNDLE}/Contents/MacOS"
  )
  set_target_properties(webserver
    PROPERTIES
      RUNTIME_OUTPUT_DIRECTORY "${APP_BUNDLE}/Contents/MacOS"
  )
  configure_file("utils/macOS/Info.plist" "${APP_BUNDLE}/Contents/Info.plist" @ONLY)
endif()

#######################################################################################################################
# setup tests

dpf_add_executable(tests
  UI_TYPE none
)

target_include_directories(tests
  PRIVATE
    src
)

target_link_libraries(tests
  PRIVATE
    hidapi::hidapi
    $<$<BOOL:${WIN32}>:winmm>
    ${CMAKE_THREAD_LIBS_INIT}
)

target_sources(tests
  PRIVATE
    src/anfima-hid.cpp
    src/tests.cpp
)

#######################################################################################################################
