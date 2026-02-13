// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

#include "Application.hpp"
#include "WebView.hpp"
#include "Window.hpp"

#include "webserver.hpp"

class AnfimaWebWindow : public Window,
                        private IdleCallback
{
    static constexpr const uint kMinimumWidth = 998;
    static constexpr const uint kMinimumHeight = 600;

    WebServer* webServer = webserver_init();

    bool webViewOk = false;

public:
    AnfimaWebWindow(Application& app)
        : Window(app)
    {
        const double scaleFactor = getScaleFactor();
        setGeometryConstraints(kMinimumWidth * scaleFactor, kMinimumHeight * scaleFactor);
        setSize(kMinimumWidth * scaleFactor, kMinimumHeight * scaleFactor);
        setResizable(true);
        setTitle("Anfima");

        addIdleCallback(this);

        WebViewOptions options;
        options.callback = _webViewMessageCallback;
        options.callbackPtr = this;
        options.initialJS = "const RunningFromDPF = true;";

        webViewOk = createWebView("http://127.0.0.1:8888/", options);
    }

    ~AnfimaWebWindow()
    {
        if (webServer != nullptr)
            webserver_close(webServer);
    }

    bool ok() const noexcept
    {
        return webViewOk;
    }

protected:
    void idleCallback() override
    {
        if (webServer != nullptr && ! webserver_idle(webServer))
        {
            webserver_close(webServer);
            webServer = nullptr;
        }
    }

    void webViewMessageCallback(char* msg)
    {
        d_debug("webViewMessageCallback: \n%s\n", msg);
    }

    static void _webViewMessageCallback(void* arg, char* msg)
    {
        static_cast<AnfimaWebWindow*>(arg)->webViewMessageCallback(msg);
    }

    DISTRHO_DECLARE_NON_COPYABLE(AnfimaWebWindow);
};

int main(int argc, char* argv[])
{
    Application app(argc, argv);
    // app.setClassName("Anfima");

    if (AnfimaWebWindow window(app); window.ok())
    {
        window.show();
        app.exec();
    }
    else
    {
#ifdef DISTRHO_OS_LINUX
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
