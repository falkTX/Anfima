// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#include "anfima-hid.h"
#include "anfima-serial.h"

#include "DistrhoUtils.hpp"
#include "extra/Sleep.hpp"
#include "extra/Time.hpp"

#if 1
#define JSON_NO_IO
#include <string>
#include "nlohmann/json.hpp"
#else
static const char* gNextExpectedMessageReply = nullptr;
static bool gNextExpectedMessageReplyReceived = false;

static void hid_callback(void* const arg, const char* const reply)
{
    d_stdout("hid_callback...");
    const char* const expectedMessageReply = *static_cast<const char**>(arg);
    DISTRHO_SAFE_ASSERT_RETURN(expectedMessageReply != nullptr, std::abort());

    if (std::strcmp(expectedMessageReply, reply) == 0)
    {
        gNextExpectedMessageReplyReceived = true;
        return;
    }

    d_stderr("Test failed!\nUnexpected reply: %s", reply);
    std::abort();
}

static void test(HID* const hid, const char* const msg, const char* const reply)
{
    gNextExpectedMessageReply = reply;
    gNextExpectedMessageReplyReceived = false;

    anfima_hid_send(hid, msg);

    for (uint32_t time = d_gettime_ms(); d_gettime_ms() - time < 1000;)
    {
        if (anfima_hid_is_reading(hid))
        {
            d_stdout("reading...");
            time = d_gettime_ms();
            continue;
        }

        if (anfima_hid_idle(hid))
        {
            if (gNextExpectedMessageReplyReceived)
                break;

            d_stdout("not reading...");
            d_msleep(50);
            continue;
        }

        d_stderr("Test failed!\nMessage sent: %s\nExpected reply: %s\nHID closed unexpectedly", msg, reply);
        std::abort();
    }

    if (gNextExpectedMessageReplyReceived)
    {
        d_stdout("ok!");
        return;
    }

    d_stderr("Test failed!\nMessage sent: %s\nExpected reply: %s\nDid not receive a reply", msg, reply);
    std::abort();
}
#endif

int main(int argc, char* argv[])
{
    std::string message;
    HID* const hid = anfima_hid_init(
        [](void* data, const char* message)
        {
            *static_cast<std::string*>(data) = message;
        },
        &message);
    DISTRHO_SAFE_ASSERT_RETURN(hid != nullptr, 1);

    const char* serial_number = anfima_hid_serial_number(hid);
    DISTRHO_SAFE_ASSERT_RETURN(serial_number != nullptr, 1);

    d_stdout("Connected! Requestion version information...");
    anfima_hid_send(hid, R"({"action":"fetch_firmware_version","payload":{}})");

    uint32_t time = d_gettime_ms();
    while (anfima_hid_idle(hid) && message.empty() && d_gettime_ms() - time < 1000)
    {
        d_msleep(50);
        continue;
    }

    if (message.empty())
    {
        d_stderr("Timed out waiting for Anagram reply");
        anfima_hid_close(hid);
        return 1;
    }

    nlohmann::json fwversion = nlohmann::json::parse(message);
    std::string version = fwversion["payload"]["data"]["version"];

    if (version == "v1.15.0.18\n")
    {
        d_stdout("Already updated, nothing to do");
        anfima_hid_close(hid);
        return 1;
    }

    d_stdout("Needs update, requesting file upload...");
    anfima_hid_send(hid, R"({"action":"open_file_receiver","payload":{"fileName":"darkglass-update.tar","dirName":"","isFirmware":1}})");

    message.clear();
    time = d_gettime_ms();
    while (anfima_hid_idle(hid) && message.empty() && d_gettime_ms() - time < 1000)
    {
        d_msleep(50);
        continue;
    }

    if (message.empty())
    {
        d_stderr("Timed out waiting for Anagram reply");
        anfima_hid_close(hid);
        return 1;
    }

    d_stdout("Uploading file...");
    Serial* const serial = anfima_serial_open(serial_number);
    DISTRHO_SAFE_ASSERT_RETURN(serial != nullptr, 1);

    const bool serialFileOk = anfima_serial_send_file(serial, "." DISTRHO_OS_SEP_STR "darkglass-pablito-v1.15.0.18-2026-05-19-pablito-release-1.15-39025d8c.tar");

    if (serialFileOk)
    {
        int progress = -2;
        while (anfima_serial_idle(serial, &progress))
        {
            fprintf(stdout, "\r[dpf] Uploading file... %d %%", progress);
            fflush(stdout);
            d_msleep(100);
        }

        fprintf(stdout,"\n");
        fflush(stdout);

        if (progress < 0)
        {
            d_stderr("Failed to upload file: %s", anfima_serial_error(serial));
        }
    }
    else
    {
        d_stderr("Failed to send file: %s", anfima_serial_error(serial));
    }

    anfima_serial_close(serial);

    if (serialFileOk)
    {
        d_stdout("Reboot into restore...");
        anfima_hid_send(hid, R"({"action":"firmware_transfer_completed","payload":{}})");

        // NOTE no reply, but wait until HID device goes offline
        time = d_gettime_ms();
        while (anfima_hid_idle(hid) && d_gettime_ms() - time < 5000)
        {
            d_msleep(50);
            continue;
        }
    }

#if 1
#else
    test(hid,
         R"(
{
    "action": "fetch_firmware_version",
    "payload": { }
}
         )",
         R"({"action":"fetch_firmware_version_res","payload":{"data":{"capabilities":["plugin-management"],"version":"v1.15.0.81\n"},"err_message":""}})");
#endif

    anfima_hid_close(hid);
    return 0;
}
