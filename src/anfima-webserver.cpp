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
#define MIMETYPE_PNG "image/png"
#define MIMETYPE_SVG "image/svg+xml"
#define MIMETYPE_WASM "application/wasm"

#include "html-data/anfima.svg.h"
#include "html-data/anfima-og.png.h"
#include "html-data/anfima-og.svg.h"
#include "html-data/empty.html.h"
#include "html-data/index.html.h"
#include "html-data/js/anfima.js.h"
#include "html-data/js/backend.js.h"
#include "html-data/js/backend-data.js.h"
#include "html-data/js/backend-files.js.h"
#include "html-data/js/cloud.js.h"
#include "html-data/js/cloud-darkglass.js.h"
#include "html-data/js/cloud-modaudio.js.h"
#include "html-data/js/constants.js.h"
#include "html-data/js/dpf.js.h"
#include "html-data/js/html.js.h"
#include "html-data/js/logger.js.h"
#include "html-data/js/utils.js.h"
#include "html-data/js/wasm.js.h"
#include "html-data/js/backends/simulator.js.h"
#include "html-data/js/backends/web-bluetooth.js.h"
#include "html-data/js/backends/web-hid.js.h"
#include "html-data/js/backends/web-midi.js.h"
#include "html-data/js/backends/web-serial.js.h"
#include "html-data/js/pages/file-manager.js.h"
#include "html-data/js/pages/plugin-manager.js.h"
#include "html-data/js/pages/preset-manager.js.h"
#include "html-data/js/pages/info.js.h"
#include "html-data/js/pages/tools.js.h"
#include "html-data/js/resources/reset-user-settings.js.h"
#include "html-data/uikit/uikit-css.min.css.h"
#include "html-data/uikit/uikit-icons.min.js.h"
#include "html-data/uikit/uikit-js.min.js.h"
#include "html-data/wasm/anfima.js.h"
#include "html-data/wasm/anfima.wasm.h"

struct WebServerFile {
    const char* filename;
    const char* type;
    const unsigned char* data;
    unsigned int size;
};

static constexpr const WebServerFile kWebServerFiles[] = {
    { "/",                             MIMETYPE_HTML, INDEX_HTML_DATA,                   INDEX_HTML_LEN                   },
    { "/empty.html",                   MIMETYPE_HTML, EMPTY_HTML_DATA,                   EMPTY_HTML_LEN                   },
    { "/anfima.svg",                   MIMETYPE_SVG,  ANFIMA_SVG_DATA,                   ANFIMA_SVG_LEN                   },
    { "/anfima-og.png",                MIMETYPE_PNG,  ANFIMA_OG_PNG_DATA,                ANFIMA_OG_PNG_LEN                },
    { "/anfima-og.svg",                MIMETYPE_SVG,  ANFIMA_OG_SVG_DATA,                ANFIMA_OG_SVG_LEN                },
    { "/js/anfima.js",                 MIMETYPE_JS,   JS_ANFIMA_JS_DATA,                 JS_ANFIMA_JS_LEN                 },
    { "/js/backend.js",                MIMETYPE_JS,   JS_BACKEND_JS_DATA,                JS_BACKEND_JS_LEN                },
    { "/js/backend-data.js",           MIMETYPE_JS,   JS_BACKEND_DATA_JS_DATA,           JS_BACKEND_DATA_JS_LEN           },
    { "/js/backend-files.js",          MIMETYPE_JS,   JS_BACKEND_FILES_JS_DATA,          JS_BACKEND_FILES_JS_LEN          },
    { "/js/cloud.js",                  MIMETYPE_JS,   JS_CLOUD_JS_DATA,                  JS_CLOUD_JS_LEN                  },
    { "/js/cloud-darkglass.js",        MIMETYPE_JS,   JS_CLOUD_DARKGLASS_JS_DATA,        JS_CLOUD_DARKGLASS_JS_LEN        },
    { "/js/cloud-modaudio.js",         MIMETYPE_JS,   JS_CLOUD_MODAUDIO_JS_DATA,         JS_CLOUD_MODAUDIO_JS_LEN         },
    { "/js/constants.js",              MIMETYPE_JS,   JS_CONSTANTS_JS_DATA,              JS_CONSTANTS_JS_LEN              },
    { "/js/dpf.js",                    MIMETYPE_JS,   JS_DPF_JS_DATA,                    JS_DPF_JS_LEN                    },
    { "/js/html.js",                   MIMETYPE_JS,   JS_HTML_JS_DATA,                   JS_HTML_JS_LEN                   },
    { "/js/logger.js",                 MIMETYPE_JS,   JS_LOGGER_JS_DATA,                 JS_LOGGER_JS_LEN                 },
    { "/js/utils.js",                  MIMETYPE_JS,   JS_UTILS_JS_DATA,                  JS_UTILS_JS_LEN                  },
    { "/js/wasm.js",                   MIMETYPE_JS,   JS_WASM_JS_DATA,                   JS_WASM_JS_LEN                   },
    { "/js/backends/simulator.js",     MIMETYPE_JS,   JS_BACKENDS_SIMULATOR_JS_DATA,     JS_BACKENDS_SIMULATOR_JS_LEN     },
    { "/js/backends/web-bluetooth.js", MIMETYPE_JS,   JS_BACKENDS_WEB_BLUETOOTH_JS_DATA, JS_BACKENDS_WEB_BLUETOOTH_JS_LEN },
    { "/js/backends/web-hid.js",       MIMETYPE_JS,   JS_BACKENDS_WEB_HID_JS_DATA,       JS_BACKENDS_WEB_HID_JS_LEN       },
    { "/js/backends/web-midi.js",      MIMETYPE_JS,   JS_BACKENDS_WEB_MIDI_JS_DATA,      JS_BACKENDS_WEB_MIDI_JS_LEN      },
    { "/js/backends/web-serial.js",    MIMETYPE_JS,   JS_BACKENDS_WEB_SERIAL_JS_DATA,    JS_BACKENDS_WEB_SERIAL_JS_LEN    },
    { "/js/pages/file-manager.js",     MIMETYPE_JS,   JS_PAGES_FILE_MANAGER_JS_DATA,     JS_PAGES_FILE_MANAGER_JS_LEN     },
    { "/js/pages/plugin-manager.js",   MIMETYPE_JS,   JS_PAGES_PLUGIN_MANAGER_JS_DATA,   JS_PAGES_PLUGIN_MANAGER_JS_LEN   },
    { "/js/pages/preset-manager.js",   MIMETYPE_JS,   JS_PAGES_PRESET_MANAGER_JS_DATA,   JS_PAGES_PRESET_MANAGER_JS_LEN   },
    { "/js/pages/info.js",             MIMETYPE_JS,   JS_PAGES_INFO_JS_DATA,             JS_PAGES_INFO_JS_LEN             },
    { "/js/pages/tools.js",            MIMETYPE_JS,   JS_PAGES_TOOLS_JS_DATA,            JS_PAGES_TOOLS_JS_LEN            },
    { "/js/resources/reset-user-settings.js", MIMETYPE_JS, JS_RESOURCES_RESET_USER_SETTINGS_JS_DATA, JS_RESOURCES_RESET_USER_SETTINGS_JS_LEN },
    { "/uikit/uikit-css.min.css",      MIMETYPE_CSS,  UIKIT_UIKIT_CSS_MIN_CSS_DATA,      UIKIT_UIKIT_CSS_MIN_CSS_LEN      },
    { "/uikit/uikit-icons.min.js",     MIMETYPE_JS,   UIKIT_UIKIT_ICONS_MIN_JS_DATA,     UIKIT_UIKIT_ICONS_MIN_JS_LEN     },
    { "/uikit/uikit-js.min.js",        MIMETYPE_JS,   UIKIT_UIKIT_JS_MIN_JS_DATA,        UIKIT_UIKIT_JS_MIN_JS_LEN,       },
    { "/wasm/anfima.js",               MIMETYPE_JS,   WASM_ANFIMA_JS_DATA,               WASM_ANFIMA_JS_LEN,              },
    { "/wasm/anfima.wasm",             MIMETYPE_WASM, WASM_ANFIMA_WASM_DATA,             WASM_ANFIMA_WASM_LEN,            },
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

    d_stderr2("Not Found: %s", filename);
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
