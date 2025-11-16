#pragma once

#include <cstddef>
#include <cstdint>

namespace tweetnacl {

constexpr std::size_t SECRETBOX_KEY_BYTES = 32;
constexpr std::size_t SECRETBOX_NONCE_BYTES = 24;
constexpr std::size_t SECRETBOX_ZEROBYTES = 32;
constexpr std::size_t SECRETBOX_BOXZEROBYTES = 16;
constexpr std::size_t SECRETBOX_MAC_BYTES = SECRETBOX_BOXZEROBYTES;

int crypto_secretbox_easy(
    unsigned char *c,
    const unsigned char *m,
    unsigned long long mlen,
    const unsigned char *n,
    const unsigned char *k);

int crypto_secretbox_open_easy(
    unsigned char *m,
    const unsigned char *c,
    unsigned long long clen,
    const unsigned char *n,
    const unsigned char *k);

}  // namespace tweetnacl


