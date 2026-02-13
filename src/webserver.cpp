// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

// TODO remove use of global vars in bittyhttp

#include "webserver.hpp"
#include "extra/Time.hpp"

#include <cstdio>

extern "C" {
#define WebServer WebServerC
#include "WebServer.h"
#undef WebServer
}

// --------------------------------------------------------------------------------------------------------------------

static constexpr const char html_index[] = R"(
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="cache-control" content="no-cache" />
    <title>Anfima</title>
  </head>
  <body>
    Hello World!
  </body>
</html>
)";

struct WebServerFile {
    const char* filename;
    const char* type;
    const char* data;
    unsigned int size;
};

static constexpr const WebServerFile kWebServerFiles[] = {
    { "/", "text/html", html_index, sizeof(html_index) },
};

// --------------------------------------------------------------------------------------------------------------------

struct WebServer {
    // TODO
    bool todo;
};

// --------------------------------------------------------------------------------------------------------------------

bool FS_GetFileProperties(const char* const filename, struct WSPageProp* const prop)
{
    for (uint8_t i = 0; i < ARRAY_SIZE(kWebServerFiles); ++i)
    {
        const WebServerFile& file = kWebServerFiles[i];

        if (std::strcmp(filename, file.filename)==0)
        {
            prop->DynamicFile = false;
            prop->Cookies = nullptr;
            prop->Gets = nullptr;
            prop->Posts = nullptr;
            prop->FileData = &file;
            return true;
        }
    }

    return false;
}

void FS_SendFile(struct WebServerC* const web, const void* const fileData)
{
    const WebServerFile* const filePtr = reinterpret_cast<const WebServerFile*>(fileData);
    DISTRHO_SAFE_ASSERT_RETURN(filePtr != nullptr,);

    const WebServerFile& file = *filePtr;
    WS_WriteWhole(web, file.type, file.data, file.size);
}

t_ElapsedTime ReadElapsedClock()
{
    return d_gettime_ms() / 1000;
}

// --------------------------------------------------------------------------------------------------------------------

struct WebServer* webserver_init()
{
    SocketsCon_InitSocketConSystem();
    WS_Init();

    if(! WS_Start(8888))
    {
        fprintf(stderr, "Failed to start web server\n");
        return NULL;
    }

    struct WebServer* webServer = static_cast<WebServer*>(std::malloc(sizeof(WebServer)));
    webServer->todo = true;

    return webServer;
}

bool webserver_idle(struct WebServer* const webServer)
{
    WS_Tick();
    return true;
}

void webserver_close(struct WebServer* const webServer)
{
    WS_Shutdown();
    SocketsCon_ShutdownSocketConSystem();
}

const char* webserver_error(struct WebServer* const webServer)
{
    return nullptr;
}

// --------------------------------------------------------------------------------------------------------------------
