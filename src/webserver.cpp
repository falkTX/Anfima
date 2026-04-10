// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

// TODO remove use of global vars in bittyhttp

// TODO make port arbitrary, run-time detection
#define WEBSERVER_STATIC_PORT_FIXME 8888

#include "webserver.h"
#include "extra/Time.hpp"

extern "C" {
#include "WebServer.h"
}

// --------------------------------------------------------------------------------------------------------------------

#include "html-data/index.html.h"
#include "html-data/uikit/uikit-css.min.css.h"
#include "html-data/uikit/uikit-icons.min.js.h"
#include "html-data/uikit/uikit-js.min.js.h"

struct WebServerFile {
    const char* filename;
    const char* type;
    const unsigned char* data;
    unsigned int size;
};

static constexpr const WebServerFile kWebServerFiles[] = {
    { "/", "text/html", INDEX_HTML_DATA, INDEX_HTML_LEN },
    { "/uikit/uikit-css.min.css", "text/css", UIKIT_UIKIT_CSS_MIN_CSS_DATA, UIKIT_UIKIT_CSS_MIN_CSS_LEN },
    { "/uikit/uikit-icons.min.js", "text/javascript", UIKIT_UIKIT_ICONS_MIN_JS_DATA, UIKIT_UIKIT_ICONS_MIN_JS_LEN },
    { "/uikit/uikit-js.min.js", "text/javascript", UIKIT_UIKIT_JS_MIN_JS_DATA, UIKIT_UIKIT_JS_MIN_JS_LEN },
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

    d_stderr("Not Found: %s", filename);
    return false;
}

void FS_SendFile(WebServerContext* const web, const void* const fileData)
{
    const WebServerFile* const filePtr = reinterpret_cast<const WebServerFile*>(fileData);
    DISTRHO_SAFE_ASSERT_RETURN(filePtr != nullptr,);

    const WebServerFile& file = *filePtr;
    d_stdout("Serving file: %s", file.filename);
    WS_WriteWhole(web, file.type, file.data, file.size);
}

t_ElapsedTime ReadElapsedClock()
{
    return d_gettime_ms() / 1000;
}

// --------------------------------------------------------------------------------------------------------------------

WebServer* webserver_init()
{
    SocketsCon_InitSocketConSystem();

    return WS_Init(WEBSERVER_STATIC_PORT_FIXME);
}

int webserver_port(WebServer* const webServer)
{
    return WEBSERVER_STATIC_PORT_FIXME;
}

bool webserver_idle(WebServer* const webServer)
{
    WS_Tick(webServer);
    return true;
}

void webserver_close(WebServer* const webServer)
{
    WS_Shutdown(webServer);
    SocketsCon_ShutdownSocketConSystem();
}

const char* webserver_error(WebServer* const webServer)
{
    return nullptr;
}

// --------------------------------------------------------------------------------------------------------------------
