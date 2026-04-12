// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

#include <algorithm>
#include <cstdint>
#include <cstring>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

#define DRWAV_API
#define DRWAV_PRIVATE static
#define DR_WAV_IMPLEMENTATION
#define DR_WAV_NO_STDIO
#define DR_WAV_NO_WCHAR
#include "../deps/dr_libs/dr_wav.h"

#define EXPORT
#define FLOATING_POINT
#define _SPEEX_TYPES_H
// #if defined(__SSE__)
// #define USE_SSE
// #elif defined (__ARM_NEON__) || defined (__ARM_NEON)
// #define USE_NEON
// #endif
typedef int16_t spx_int16_t;
typedef uint16_t spx_uint16_t;
typedef int32_t spx_int32_t;
typedef uint32_t spx_uint32_t;
#include "../deps/speexdsp/libspeexdsp/resample.c"

// #define JSON_NO_IO
#include "nlohmann/json.hpp"

#include <strstream>

extern "C" {
typedef struct ProcessedFile ProcessedFile;

EMSCRIPTEN_KEEPALIVE
ProcessedFile* procfile(const void* data, uint32_t dataSize);

EMSCRIPTEN_KEEPALIVE
const void* procfile_get_data(ProcessedFile* procfile);

EMSCRIPTEN_KEEPALIVE
uint32_t procfile_get_size(ProcessedFile* procfile);
}

struct ProcessedFile {
    uint32_t size;
    uint32_t written;
    uint8_t data[];
};

static ProcessedFile* _procfile_wav(const void* const data, const uint32_t dataSize)
{
    uint32_t size;
    uint64_t frames;
    float* buffer = nullptr;
    ProcessedFile* procfile = nullptr;
    drwav_data_format pFormat = {
        .container = drwav_container_riff,
        .format = DR_WAVE_FORMAT_PCM,
        .bitsPerSample = 32,
    };
    drwav pWav;

    if (drwav_init_memory(&pWav, data, dataSize, nullptr) != DRWAV_TRUE)
        return nullptr;

    pFormat.channels = pWav.channels;
    pFormat.sampleRate = pWav.sampleRate;
    frames = pWav.totalPCMFrameCount;

    if (buffer = static_cast<float*>(std::malloc(sizeof(float) * pFormat.channels * frames)); buffer == nullptr)
        goto free_drwav;

    if (drwav_read_pcm_frames_f32(&pWav, frames, buffer) != frames)
        goto free_buffer;

    if (pFormat.sampleRate != 48000)
    {
        SpeexResamplerState* const state = speex_resampler_init(pFormat.channels,
                                                                pFormat.sampleRate,
                                                                48000,
                                                                SPEEX_RESAMPLER_QUALITY_DESKTOP,
                                                                nullptr);
        if (state == nullptr)
            goto free_buffer;

        speex_resampler_skip_zeros(state);

        uint32_t inputFrames = frames;
        uint32_t outputFrames = frames;

        for (uint32_t rate = pFormat.sampleRate; rate < 48000; rate *= 2)
            outputFrames *= 2;

        float* const rbuffer = static_cast<float*>(std::malloc(sizeof(float) * pFormat.channels * outputFrames));
        if (rbuffer == nullptr || speex_resampler_process_interleaved_float(state,
                                                                            buffer,
                                                                            &inputFrames,
                                                                            rbuffer,
                                                                            &outputFrames) != RESAMPLER_ERR_SUCCESS)
        {
            speex_resampler_destroy(state);
            goto free_buffer;
        }

        speex_resampler_destroy(state);

        std::free(buffer);
        buffer = rbuffer;

        frames = outputFrames;
        pFormat.sampleRate = 48000;
    }

    if (pFormat.channels != 1)
    {
        for (uint32_t i = 1; i < frames; ++i)
            buffer[i] = buffer[i * pFormat.channels];

        pFormat.channels = 1;
    }

    if (size = drwav_target_write_size_bytes(&pFormat, frames, nullptr, 0); size == 0)
        goto free_buffer;

    if (procfile = static_cast<ProcessedFile*>(std::malloc(sizeof(ProcessedFile) + size)); procfile == nullptr)
        goto free_buffer;

    procfile->size = size;
    procfile->written = 0;

    drwav_uninit(&pWav);
    if (drwav_init_write_sequential(&pWav,
                                    &pFormat,
                                    frames,
                                    [](void* const pUserData,
                                       const void* const pData,
                                       const size_t bytesToWrite) -> size_t
                                    {
                                        ProcessedFile* const procfile = static_cast<ProcessedFile*>(pUserData);
                                        std::memcpy(procfile->data + procfile->written, pData, bytesToWrite);
                                        procfile->written += bytesToWrite;
                                        return bytesToWrite;
                                    },
                                    procfile,
                                    nullptr) != DRWAV_TRUE)
        goto free_procfile;

    {
        static constexpr const uint32_t buffer32len = 8192;
        int32_t buffer32[buffer32len];

        for (uint64_t i = 0, count; i < frames; i += buffer32len)
        {
            count = std::min<uint32_t>(buffer32len, frames - i);
            drwav_f32_to_s32(buffer32, buffer + i, count);

            if (drwav_write_pcm_frames(&pWav, count, buffer32) != count)
                goto free_procfile;
        }
    }

    std::free(buffer);
    drwav_uninit(&pWav);
    return procfile;

free_procfile:
    std::free(procfile);

free_buffer:
    std::free(buffer);

free_drwav:
    drwav_uninit(&pWav);
    return nullptr;
}

static ProcessedFile* _procfile_json(const void* const data, const uint32_t dataSize)
{
    nlohmann::json j;

    try {
        std::istrstream stream(static_cast<const char*>(data), dataSize);
        stream >> j;
    } catch (...) {
        return nullptr;
    }

    const std::string jsonstr = j.dump(0, ' ', false, nlohmann::detail::error_handler_t::replace);
    const uint32_t size = jsonstr.length() + 1;

    if (ProcessedFile* const procfile = static_cast<ProcessedFile*>(std::malloc(sizeof(ProcessedFile) + size)))
    {
        procfile->size = size;
        procfile->written = 0;
        std::memcpy(procfile->data, jsonstr.data(), size);
        return procfile;
    }

    return nullptr;
}

ProcessedFile* procfile(const void* const data, const uint32_t dataSize)
{
    if (static_cast<const uint8_t*>(data)[0] == '{')
        return _procfile_json(data, dataSize);

    return _procfile_wav(data, dataSize);
}

const void* procfile_get_data(ProcessedFile* const procfile)
{
    return procfile->data;
}

uint32_t procfile_get_size(ProcessedFile* const procfile)
{
    return procfile->size;
}
