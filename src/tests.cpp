// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#include "anfima-hid.h"

#include "DistrhoUtils.hpp"
#include "extra/Sleep.hpp"
#include "extra/Time.hpp"

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

int main(int argc, char* argv[])
{
    HID* const hid = anfima_hid_init(hid_callback, &gNextExpectedMessageReply);
    DISTRHO_SAFE_ASSERT_RETURN(hid != nullptr, 1);

    test(hid,
         R"(
{
    "action": "fetch_firmware_version",
    "payload": { }
}
         )",
         R"({"action":"fetch_firmware_version_res","payload":{"data":{"capabilities":["plugin-management"],"version":"v1.15.0.81\n"},"err_message":""}})");

    anfima_hid_close(hid);
    return 0;
}
