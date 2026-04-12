// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

// TODO remove use of global vars in bittyhttp

// TODO make port arbitrary, run-time detection
#define WEBSERVER_STATIC_PORT_FIXME 8888

#include "anfima-webserver.h"
#include "extra/Time.hpp"

#include <cerrno>

extern "C" {
#include "WebServer.h"
}

// --------------------------------------------------------------------------------------------------------------------

#define MIMETYPE_HTML "text/html"
#define MIMETYPE_CSS "text/css"
#define MIMETYPE_JS "text/javascript"
#define MIMETYPE_MP4 "video/mp4"

#include "html-data/index.html.h"
#include "html-data/js/anfima.js.h"
#include "html-data/js/backend.js.h"
#include "html-data/js/constants.js.h"
#include "html-data/js/html.js.h"
#include "html-data/js/logger.js.h"
#include "html-data/js/utils.js.h"
#include "html-data/js/backends/dpf.js.h"
#include "html-data/js/backends/dummy.js.h"
#include "html-data/js/backends/web-bluetooth.js.h"
#include "html-data/js/backends/web-hid.js.h"
#include "html-data/js/backends/web-midi.js.h"
#include "html-data/js/backends/web-serial.js.h"
#include "html-data/js/pages/file-manager.js.h"
#include "html-data/js/pages/tools.js.h"
#include "html-data/js/resources/reset-user-settings.js.h"
// #include "html-data/resources/anagram.mp4.h"
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
    { "/",                             MIMETYPE_HTML, INDEX_HTML_DATA    ,               INDEX_HTML_LEN                   },
    { "/js/anfima.js",                 MIMETYPE_JS,   JS_ANFIMA_JS_DATA,                 JS_ANFIMA_JS_LEN                 },
    { "/js/backend.js",                MIMETYPE_JS,   JS_BACKEND_JS_DATA,                JS_BACKEND_JS_LEN                },
    { "/js/constants.js",              MIMETYPE_JS,   JS_CONSTANTS_JS_DATA,              JS_CONSTANTS_JS_LEN              },
    { "/js/html.js",                   MIMETYPE_JS,   JS_HTML_JS_DATA,                   JS_HTML_JS_LEN                   },
    { "/js/logger.js",                 MIMETYPE_JS,   JS_LOGGER_JS_DATA,                 JS_LOGGER_JS_LEN                 },
    { "/js/utils.js",                  MIMETYPE_JS,   JS_UTILS_JS_DATA,                  JS_UTILS_JS_LEN                  },
    { "/js/backends/dpf.js",           MIMETYPE_JS,   JS_BACKENDS_DPF_JS_DATA,           JS_BACKENDS_DPF_JS_LEN           },
    { "/js/backends/dummy.js",         MIMETYPE_JS,   JS_BACKENDS_DUMMY_JS_DATA,         JS_BACKENDS_DUMMY_JS_LEN         },
    { "/js/backends/web-bluetooth.js", MIMETYPE_JS,   JS_BACKENDS_WEB_BLUETOOTH_JS_DATA, JS_BACKENDS_WEB_BLUETOOTH_JS_LEN },
    { "/js/backends/web-hid.js",       MIMETYPE_JS,   JS_BACKENDS_WEB_HID_JS_DATA,       JS_BACKENDS_WEB_HID_JS_LEN       },
    { "/js/backends/web-midi.js",      MIMETYPE_JS,   JS_BACKENDS_WEB_MIDI_JS_DATA,      JS_BACKENDS_WEB_MIDI_JS_LEN      },
    { "/js/backends/web-serial.js",    MIMETYPE_JS,   JS_BACKENDS_WEB_SERIAL_JS_DATA,    JS_BACKENDS_WEB_SERIAL_JS_LEN    },
    { "/js/pages/file-manager.js",     MIMETYPE_JS,   JS_PAGES_FILE_MANAGER_JS_DATA,     JS_PAGES_FILE_MANAGER_JS_LEN     },
    { "/js/pages/tools.js",            MIMETYPE_JS,   JS_PAGES_TOOLS_JS_DATA,            JS_PAGES_TOOLS_JS_LEN            },
    { "/js/resources/reset-user-settings.js", MIMETYPE_JS, JS_RESOURCES_RESET_USER_SETTINGS_JS_DATA, JS_RESOURCES_RESET_USER_SETTINGS_JS_LEN },
    // { "/resources/anagram.mp4",        MIMETYPE_MP4,  RESOURCES_ANAGRAM_MP4_DATA,        RESOURCES_ANAGRAM_MP4_LEN        },
    { "/uikit/uikit-css.min.css",      MIMETYPE_CSS,  UIKIT_UIKIT_CSS_MIN_CSS_DATA,      UIKIT_UIKIT_CSS_MIN_CSS_LEN      },
    { "/uikit/uikit-icons.min.js",     MIMETYPE_JS,   UIKIT_UIKIT_ICONS_MIN_JS_DATA,     UIKIT_UIKIT_ICONS_MIN_JS_LEN     },
    { "/uikit/uikit-js.min.js",        MIMETYPE_JS,   UIKIT_UIKIT_JS_MIN_JS_DATA,        UIKIT_UIKIT_JS_MIN_JS_LEN,       },
};

// --------------------------------------------------------------------------------------------------------------------

bool FS_GetFileProperties(const char* const filename, struct WSPageProp* const prop)
{
    for (uint8_t i = 0; i < ARRAY_SIZE(kWebServerFiles); ++i)
    {
        const WebServerFile& file = kWebServerFiles[i];

        if (std::strcmp(filename, file.filename)==0)
        {
           #ifdef NDEBUG
            // release builds, enable cache for everything except root
            prop->NoCache = filename[1] == '\0';
           #else
            // development builds, disable cache
            prop->NoCache = true;
           #endif
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

// TODO use ws2_32 APIs under Windows
static char* _webserver_error = nullptr;

__attribute__((destructor))
static void _free_webserver_error()
{
    std::free(_webserver_error);
    _webserver_error = nullptr;
}

static void _update_webserver_error()
{
    const int err = errno;
    std::free(_webserver_error);
    _webserver_error = strdup(std::strerror(err));
}

// --------------------------------------------------------------------------------------------------------------------

WebServer* anfima_webserver_init()
{
    SocketsCon_InitSocketConSystem();

    if (WebServer* const webServer = WS_Init(WEBSERVER_STATIC_PORT_FIXME))
        return webServer;

    _update_webserver_error();
    return nullptr;
}

int anfima_webserver_port(WebServer* const webServer)
{
    return WEBSERVER_STATIC_PORT_FIXME;
}

bool anfima_webserver_idle(WebServer* const webServer)
{
    WS_Tick(webServer);
    return true;
}

void anfima_webserver_close(WebServer* const webServer)
{
    WS_Shutdown(webServer);
    SocketsCon_ShutdownSocketConSystem();
}

const char* anfima_webserver_error(WebServer* const webServer)
{
    return _webserver_error;
}

// --------------------------------------------------------------------------------------------------------------------
