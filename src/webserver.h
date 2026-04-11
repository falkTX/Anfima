// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

#pragma once

#ifdef __cplusplus
extern "C" {
#else
#include <stdbool.h>
#endif

struct WebServer;

struct WebServer* anfima_webserver_init();
int anfima_webserver_port(struct WebServer* webServer);
bool anfima_webserver_idle(struct WebServer* webserver);
void anfima_webserver_close(struct WebServer* webserver);

const char* anfima_webserver_error(struct WebServer* webserver);

#ifdef __cplusplus
}
#endif
