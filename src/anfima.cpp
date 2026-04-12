// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#include "Application.hpp"
#include "Window.hpp"
#include "extra/Base64.hpp"
#include "extra/Time.hpp"

#include "anfima-hid.h"
#include "anfima-serial.h"
#include "anfima-webserver.h"

#include <string>

#ifdef _WIN32
#include <windows.h>
#else
#include <signal.h>
#include <unistd.h>
#endif

// --------------------------------------------------------------------------------------------------------------------
// base64 stuff, based on http://www.adp-gmbh.ch/cpp/common/base64.html

/*
   Copyright (C) 2004-2008 René Nyffenegger

   This source code is provided 'as-is', without any express or implied
   warranty. In no event will the author be held liable for any damages
   arising from the use of this software.

   Permission is granted to anyone to use this software for any purpose,
   including commercial applications, and to alter it and redistribute it
   freely, subject to the following restrictions:

   1. The origin of this source code must not be misrepresented; you must not
      claim that you wrote the original source code. If you use this source code
      in a product, an acknowledgment in the product documentation would be
      appreciated but is not required.

   2. Altered source versions must be plainly marked as such, and must not be
      misrepresented as being the original source code.

   3. This notice may not be removed or altered from any source distribution.

   René Nyffenegger rene.nyffenegger@adp-gmbh.ch
*/

static inline
void getChunkFromBase64String(const char* const base64string, SerialStreamingPayload& serialPayload)
{
    uint8_t* const buffer = static_cast<uint8_t*>(serialPayload.buffer);
    const int size = serialPayload.size;
    int offset = serialPayload.written;

    uint i = 0, j = 0;
    uint charArray3[3], charArray4[4];

    for (std::size_t l = 0; base64string[l] != 0; ++l)
    {
        const char c = base64string[l];

        if (c == '\0' || c == '=')
            break;
        if (c == ' ' || c == '\n')
            continue;

        DISTRHO_SAFE_ASSERT_CONTINUE(DistrhoBase64Helpers::isBase64Char(c));

        charArray4[i++] = static_cast<uint>(c);

        if (i == 4)
        {
            for (i=0; i<4; ++i)
                charArray4[i] = DistrhoBase64Helpers::findBase64CharIndex(static_cast<char>(charArray4[i]));

            charArray3[0] =  (charArray4[0] << 2)        + ((charArray4[1] & 0x30) >> 4);
            charArray3[1] = ((charArray4[1] & 0xf) << 4) + ((charArray4[2] & 0x3c) >> 2);
            charArray3[2] = ((charArray4[2] & 0x3) << 6) +   charArray4[3];

            DISTRHO_SAFE_ASSERT_INT2_RETURN(offset + 3 <= size, offset, size,);

            for (i = 0; i < 3; ++i)
                buffer[offset++] = static_cast<uint8_t>(charArray3[i]);

            i = 0;
        }
    }

    if (i != 0)
    {
        for (j=0; j<i && j<4; ++j)
            charArray4[j] = DistrhoBase64Helpers::findBase64CharIndex(static_cast<char>(charArray4[j]));

        for (j=i; j<4; ++j)
            charArray4[j] = 0;

        charArray3[0] =  (charArray4[0] << 2)        + ((charArray4[1] & 0x30) >> 4);
        charArray3[1] = ((charArray4[1] & 0xf) << 4) + ((charArray4[2] & 0x3c) >> 2);
        charArray3[2] = ((charArray4[2] & 0x3) << 6) +   charArray4[3];

        DISTRHO_SAFE_ASSERT_INT2_RETURN(offset + i - 1 <= size, offset, size,);

        for (j=0; i>0 && j<i-1; j++)
            buffer[offset++] = static_cast<uint8_t>(charArray3[j]);
    }

    serialPayload.written = offset;
}

// --------------------------------------------------------------------------------------------------------------------

class AnfimaWebWindow : public Window,
                        private IdleCallback
{
    HID* hid = nullptr;
    Serial* serial = nullptr;
    WebServer* webServer = anfima_webserver_init();

    SerialStreamingPayload serialPayload = {};

    int32_t lastSerialIdleProgress = -1;
    uint lastTimeCheckHID = 0;

    bool webViewOk = false;
    bool webviewStarted = false;

    static bool idleLoopRunning;

public:
    AnfimaWebWindow(Application& app)
        : Window(app)
    {
        const double scaleFactor = getScaleFactor();
        const uint width = 1100 * scaleFactor;
        const uint height = 700 * scaleFactor;
        setResizable(true);
        setGeometryConstraints(300, 200);
        setSize(width, height);
        setTitle("Anfima");

        if (webServer == nullptr)
        {
            d_stderr2("Failed to start WebServer: %s", anfima_webserver_error(nullptr));
            return;
        }

        addIdleCallback(this);

        WebViewOptions options;
        options.callback = [](void* const arg, char* const msg){
            static_cast<AnfimaWebWindow*>(arg)->webViewMessageCallback(msg);
        };
        options.callbackPtr = this;
        options.initialJS = "RunningFromDPF = true;";

        webViewOk = createWebView("http://127.0.0.1:8888/", options);

       #ifdef _WIN32
        SetConsoleCtrlHandler([] WINAPI (const DWORD dwCtrlType) -> BOOL {
            if (dwCtrlType == CTRL_C_EVENT)
            {
                idleLoopRunning = false;
                return TRUE;
            }
            return FALSE;
        }, TRUE);
       #else
        struct sigaction sig = {};
        sig.sa_handler = [](const int sig){
            switch (sig)
            {
            case SIGINT:
            case SIGTERM:
                idleLoopRunning = false;
                break;
            }
        };
        sig.sa_flags = SA_RESTART;
        sigemptyset(&sig.sa_mask);
        sigaction(SIGINT, &sig, nullptr);
        sigaction(SIGTERM, &sig, nullptr);
       #endif
    }

    ~AnfimaWebWindow()
    {
        idleLoopRunning = false;
        webViewOk = false;

        std::free(serialPayload.buffer);

        if (webServer != nullptr)
            anfima_webserver_close(webServer);

        if (serial != nullptr)
            anfima_serial_close(serial);

        if (hid != nullptr)
            anfima_hid_close(hid);
    }

    bool ok() const noexcept
    {
        return webViewOk;
    }

protected:
    void idleCallback() override
    {
        Application& app = getApp();

        if (! idleLoopRunning)
        {
            d_stdout("Caught Ctrl + C, closing down...");
            app.quit();
            return;
        }
        if (app.isQuitting())
        {
            d_stderr("FIXME: idleCallback received while application is closing down");
            return;
        }

        if (hid == nullptr)
        {
            if (const uint now = d_gettime_ms(); now - lastTimeCheckHID > 1000)
            {
                lastTimeCheckHID = now;

                hid = anfima_hid_init([](void* const arg, const char* const msg){
                                            static_cast<AnfimaWebWindow*>(arg)->hidMessageCallback(msg);
                                        }, this);
                if (hid != nullptr)
                {
                    d_stdout("HID has been connected!");
                    reportConnected();
                }
                else if (webviewStarted)
                {
                    if (const char* const error = anfima_hid_error())
                    {
                        std::string hidmsg;
                        hidmsg.reserve(std::strlen(error) + 15);
                        hidmsg += "dpfReceiveIPC(\"";
                        hidmsg += error;
                        hidmsg += "\")";
                        evaluateJS(hidmsg.c_str());
                    }
                }
            }
        }

        if (hid != nullptr)
        {
            if (anfima_hid_idle(hid))
            {
                if (anfima_hid_is_reading(hid) && webviewStarted)
                    evaluateJS("dpfIdleMessageReply()");
            }
            else
            {
                anfima_hid_close(hid);
                hid = nullptr;

                if (webviewStarted)
                    evaluateJS("dpfDisconnected()");
            }
        }

        if (serial != nullptr && lastSerialIdleProgress != -1)
        {
            int progress;
            if (anfima_serial_idle(serial, &progress))
            {
                if (webviewStarted && lastSerialIdleProgress != progress)
                {
                    lastSerialIdleProgress = progress;

                    std::string msg;
                    msg.reserve(31);
                    msg += "dpfSerialTransferProgress(";
                    msg += std::to_string(progress);
                    msg += ")";
                    evaluateJS(msg.c_str());
                }
            }
            else
            {
                lastSerialIdleProgress = -1;

                if (progress < 0)
                {
                    if (webviewStarted)
                    {
                        if (const char* const error = anfima_serial_error(serial))
                        {
                            std::string msg;
                            msg.reserve(std::strlen(error) + 24);
                            msg += "dpfSerialTransferDone(";
                            msg += error;
                            msg += ")";
                            evaluateJS(msg.c_str());
                        }
                        else
                        {
                            evaluateJS("dpfSerialTransferDone(\"Unknown error\")");
                        }
                    }

                    anfima_serial_close(serial);
                    serial = nullptr;
                }
                else
                {
                    anfima_serial_clear(serial);

                    if (webviewStarted)
                        evaluateJS("dpfSerialTransferDone()");
                }
            }
        }

        if (webServer != nullptr && ! anfima_webserver_idle(webServer))
        {
            anfima_webserver_close(webServer);
            webServer = nullptr;
        }
    }

    void reportConnected()
    {
        if (hid != nullptr && webviewStarted)
            evaluateJS("dpfConnected()");
    }

    void hidMessageCallback(const char* const msg)
    {
        d_debug("hidMessageCallback: \n%s\n", msg);

        if (! webViewOk)
        {
            d_stderr("received hid message while not started yet: %.24s", msg);
            return;
        }

        std::string hidmsg;
        hidmsg.reserve(std::strlen(msg) + 13);
        hidmsg += "dpfReceiveMessageReply(";
        hidmsg += msg;
        hidmsg += ")";
        evaluateJS(hidmsg.c_str());
    }

    void webViewMessageCallback(char* msg)
    {
        if (msg[0] == '|')
        {
            ++msg;
            d_debug("webViewMessageCallback: %.24s", msg);

            if (std::strcmp(msg, "started|") == 0)
            {
                d_stdout("WebView has been fully loaded!");
                webviewStarted = true;
                show();
                reportConnected();
                return;
            }

            if (! webViewOk)
                d_stderr("received web message while not started yet: %.24s", msg);

            evaluateJS("dpfIdleIPC()");

            if (std::strncmp(msg, "serial|", 7) == 0)
            {
                msg += 7;

                if (std::strcmp(msg, "connect|") == 0)
                {
                    DISTRHO_SAFE_ASSERT(serial == nullptr);

                    if (serial = anfima_serial_open(anfima_hid_serial_number(hid)); serial == nullptr)
                    {
                        evaluateJS("dpfReceiveIPC(\"Failed to open serial device\")");
                        return;
                    }

                    evaluateJS("dpfReceiveIPC()");
                    return;
                }

                if (std::strcmp(msg, "release|") == 0)
                {
                    if (serial != nullptr)
                    {
                        anfima_serial_close(serial);
                        serial = nullptr;
                    }

                    evaluateJS("dpfReceiveIPC()");
                    return;
                }

                if (serial == nullptr)
                {
                    evaluateJS("dpfReceiveIPC(\"Serial device is not connected\")");
                    return;
                }

                if (std::strncmp(msg, "size|", 5) == 0)
                {
                    msg += 5;

                    const int size = std::atoi(msg);
                    if (size == 0)
                    {
                        evaluateJS("dpfReceiveIPC(\"Invalid file size\")");
                        return;
                    }

                    serialPayload.buffer = std::realloc(serialPayload.buffer, size + 1);

                    if (serialPayload.buffer == nullptr)
                    {
                        evaluateJS("dpfReceiveIPC(\"Out of memory\")");
                        return;
                    }

                    serialPayload.read = serialPayload.written = 0;
                    serialPayload.size = size;

                    if (! anfima_serial_send_streaming_payload(serial, &serialPayload))
                    {
                        d_stderr(anfima_serial_error(serial));
                        evaluateJS("dpfReceiveIPC(\"Serial transfer streaming failed\")");
                        return;
                    }

                    lastSerialIdleProgress = 0;
                    evaluateJS("dpfReceiveIPC()");
                    return;
                }

                if (std::strncmp(msg, "data|", 5) == 0)
                {
                    msg += 5;

                    if (lastSerialIdleProgress == -1)
                    {
                        evaluateJS("dpfReceiveIPC(\"Received more data after transfer completion\")");
                        return;
                    }

                    getChunkFromBase64String(msg, serialPayload);
                    evaluateJS("dpfReceiveIPC()");
                    return;
                }
            }

            evaluateJS("dpfReceiveIPC(\"Unknown or invalid message\")");
            d_stderr2("unknown or invalid message received: %s", msg);
            return;
        }

        DISTRHO_SAFE_ASSERT_RETURN(hid != nullptr,);

        anfima_hid_send(hid, msg);
    }

    DISTRHO_DECLARE_NON_COPYABLE(AnfimaWebWindow);
};

// --------------------------------------------------------------------------------------------------------------------

bool AnfimaWebWindow::idleLoopRunning = true;

// --------------------------------------------------------------------------------------------------------------------

int main(int argc, char* argv[])
{
    Application app(argc, argv);
    // app.setClassName("Anfima");

    if (AnfimaWebWindow window(app); window.ok())
    {
       #ifdef _WIN32
        // FIXME find out why this is necessary
        window.show();
       #endif
        app.exec();
    }
    else
    {
       #ifdef DISTRHO_OS_LINUX
        setenv("LC_ALL", "C.UTF-8", 1);

        static constexpr const char* cmds[] = {
            "kdialog --title Anfima --error \"Failed to create Web View, cannot start application.\"",
            "zenity --title Anfima --error --text \"Failed to create Web View, cannot start application.\"",
            "xmessage -buttons OK -default OK \"Failed to create Web View, cannot start application.\"",
        };

        for (const char* cmd : cmds)
        {
            int r = system(cmd);
            if (WEXITSTATUS(r) != 127)
                break;
        }
       #else
        d_stderr2("Failed to create Web View, cannot start application");
       #endif

        return 1;
    }

    return 0;
}

// --------------------------------------------------------------------------------------------------------------------
