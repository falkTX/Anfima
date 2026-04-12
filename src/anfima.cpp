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

class AnfimaWebWindow : public Window,
                        private IdleCallback
{
    HID* hid = nullptr;
    Serial* serial = nullptr;
    WebServer* webServer = anfima_webserver_init();

    std::vector<uint8_t> serialChunk;

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
        if (! idleLoopRunning)
        {
            getApp().quit();
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
                        hidmsg += "dpfReceive(\"";
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
                    evaluateJS("dpfIdle()");
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

        std::string hidmsg;
        hidmsg.reserve(std::strlen(msg) + 13);
        hidmsg += "dpfReceive(";
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

            if (std::strncmp(msg, "serial|", 7) == 0)
            {
                msg += 7;

                if (std::strcmp(msg, "connect|") == 0)
                {
                    DISTRHO_SAFE_ASSERT(serial == nullptr);

                    if (serial = anfima_serial_open(); serial == nullptr)
                    {
                        evaluateJS("dpfReceive(\"Failed to open serial device\")");
                        return;
                    }

                    evaluateJS("dpfReceive()");
                    return;
                }

                if (std::strcmp(msg, "release|") == 0)
                {
                    if (serial != nullptr)
                    {
                        anfima_serial_close(serial);
                        serial = nullptr;
                    }

                    evaluateJS("dpfReceive()");
                    return;
                }

                if (serial == nullptr)
                {
                    evaluateJS("dpfReceive(\"Serial device is not connected\")");
                    return;
                }

                if (std::strncmp(msg, "send|", 5) == 0)
                {
                    msg += 5;

                    d_stderr2("got big send packet!");

                    d_getChunkFromBase64String_impl(serialChunk, msg);

                    d_stderr2("wrote chunk as %lu size", serialChunk.size());

                    if (! anfima_serial_send(serial, serialChunk.data(), serialChunk.size()))
                    {
                        evaluateJS("dpfReceive(\"Serial device transfer failed\")");
                    }

                    lastSerialIdleProgress = 0;

                    evaluateJS("dpfReceive()");
                    return;
                }
            }

            evaluateJS("dpfReceive(\"Unknown or invalid message\")");
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
