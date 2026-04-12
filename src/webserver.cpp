// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#include "DistrhoUtils.hpp"
#include "extra/Sleep.hpp"

#include "anfima-webserver.h"

#include <cstdio>

int main(int argc, char* argv[])
{
    WebServer* const webServer = anfima_webserver_init();
    if (webServer == nullptr)
    {
        d_stderr2("Failed to start WebServer: %s", anfima_webserver_error(nullptr));
        return 1;
    }

    d_stderr2("WebServer started, url is 'http://127.0.0.1:%d/'", anfima_webserver_port(webServer));

    while (anfima_webserver_idle(webServer))
        d_msleep(50);

    anfima_webserver_close(webServer);
    return 0;
}
