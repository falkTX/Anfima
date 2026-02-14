# Copyright (C) 2026 Filipe Coelho <falktx@falktx.com>
# SPDX-License-Identifier: ISC

cmake_minimum_required(VERSION 3.15)
project(anfima)

set(CMAKE_POLICY_DEFAULT_CMP0025 NEW)
set(CMAKE_POLICY_DEFAULT_CMP0063 NEW)
set(CMAKE_POLICY_DEFAULT_CMP0069 NEW)
set(CMAKE_POLICY_DEFAULT_CMP0126 NEW)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

set(CMAKE_C_VISIBILITY_PRESET hidden)
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_VISIBILITY_INLINES_HIDDEN TRUE)

# hidapi setup
set(BUILD_SHARED_LIBS OFF)

find_package(Threads REQUIRED)

add_subdirectory(deps/bittyhttp)
add_subdirectory(deps/dpf)
add_subdirectory(deps/hidapi)
add_subdirectory(deps/libfios)

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
  PUBLIC
    bittyhttp::interface
    hidapi::hidapi
    libfios::interface
    ${CMAKE_THREAD_LIBS_INIT}
)

target_sources(anfima
  PRIVATE
    src/anfima.cpp
    src/webserver.cpp
)
