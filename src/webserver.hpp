// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

#pragma once

#ifdef __cplusplus
extern "C" {
#else
#include <stdbool.h>
#endif

struct WebServer;

struct WebServer* webserver_init();
bool webserver_idle(struct WebServer* webserver);
void webserver_close(struct WebServer* webserver);

const char* webserver_error(struct WebServer* webserver);

#ifdef __cplusplus
}
#endif
