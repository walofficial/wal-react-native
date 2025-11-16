#include "TweetNaClSecretbox.h"

#include <algorithm>
#include <array>
#include <cstddef>
#include <cstring>
#include <vector>

namespace tweetnacl {

namespace {

#define FOR(i, n) for (std::size_t i = 0; i < (n); ++i)
#define sv static void

using u8 = unsigned char;
using u32 = unsigned long;
using u64 = unsigned long long;

sv st32(u8 *x, u32 u) {
  for (int i = 0; i < 4; ++i) {
    x[i] = static_cast<u8>(u);
    u >>= 8;
  }
}

static u32 ld32(const u8 *x) {
  u32 u = x[3];
  u = (u << 8) | x[2];
  u = (u << 8) | x[1];
  return (u << 8) | x[0];
}

static u32 L32(u32 x, int c) {
  return (x << c) | ((x & 0xffffffff) >> (32 - c));
}

sv ts64(u8 *x, u64 u) {
  for (int i = 7; i >= 0; --i) {
    x[i] = static_cast<u8>(u);
    u >>= 8;
  }
}

static u64 dl64(const u8 *x) {
  u64 u = 0;
  FOR(i, 8) {
    u = (u << 8) | x[i];
  }
  return u;
}

int vn(const u8 *x, const u8 *y, int n) {
  u32 d = 0;
  FOR(i, n) {
    d |= x[i] ^ y[i];
  }
  return (1 & ((d - 1) >> 8)) - 1;
}

int crypto_verify_16(const u8 *x, const u8 *y) {
  return vn(x, y, 16);
}

int crypto_verify_32(const u8 *x, const u8 *y) {
  return vn(x, y, 32);
}

sv core(u8 *out, const u8 *in, const u8 *k, const u8 *c, int h) {
  u32 w[16], x[16], y[16], t[4];
  FOR(i, 4) {
    x[5 * i] = ld32(c + 4 * i);
    x[1 + i] = ld32(k + 4 * i);
    x[6 + i] = ld32(in + 4 * i);
    x[11 + i] = ld32(k + 16 + 4 * i);
  }
  FOR(i, 16) {
    y[i] = x[i];
  }
  FOR(i, 20) {
    FOR(j, 4) {
      FOR(m, 4) {
        t[m] = x[(5 * j + 4 * m) % 16];
      }
      t[1] ^= L32(t[0] + t[3], 7);
      t[2] ^= L32(t[1] + t[0], 9);
      t[3] ^= L32(t[2] + t[1], 13);
      t[0] ^= L32(t[3] + t[2], 18);
      FOR(m, 4) {
        w[4 * j + (j + m) % 4] = t[m];
      }
    }
    FOR(m, 16) {
      x[m] = w[m];
    }
  }
  if (h) {
    FOR(i, 16) {
      x[i] += y[i];
    }
    FOR(i, 4) {
      x[5 * i] -= ld32(c + 4 * i);
      x[6 + i] -= ld32(in + 4 * i);
    }
    FOR(i, 4) {
      st32(out + 4 * i, x[5 * i]);
      st32(out + 16 + 4 * i, x[6 + i]);
    }
  } else {
    FOR(i, 16) {
      st32(out + 4 * i, x[i] + y[i]);
    }
  }
}

int crypto_core_salsa20(u8 *out, const u8 *in, const u8 *k, const u8 *c) {
  core(out, in, k, c, 0);
  return 0;
}

int crypto_core_hsalsa20(u8 *out, const u8 *in, const u8 *k, const u8 *c) {
  core(out, in, k, c, 1);
  return 0;
}

static const u8 sigma[16] = {'e', 'x', 'p', 'a', 'n', 'd', ' ', '3',
                             '2', '-', 'b', 'y', 't', 'e', ' ', 'k'};

int crypto_stream_salsa20_xor(u8 *c,
                              const u8 *m,
                              u64 b,
                              const u8 *n,
                              const u8 *k) {
  u8 z[16], x[64];
  u32 u;
  std::size_t i;
  if (b == 0) {
    return 0;
  }
  FOR(i, 16) {
    z[i] = 0;
  }
  FOR(i, 8) {
    z[i] = n[i];
  }
  while (b >= 64) {
    crypto_core_salsa20(x, z, k, sigma);
    FOR(i, 64) {
      c[i] = (m ? m[i] : 0) ^ x[i];
    }
    u = 1;
    for (i = 8; i < 16; ++i) {
      u += (u32)z[i];
      z[i] = static_cast<u8>(u);
      u >>= 8;
    }
    b -= 64;
    c += 64;
    if (m) {
      m += 64;
    }
  }
  if (b) {
    crypto_core_salsa20(x, z, k, sigma);
    FOR(i, b) {
      c[i] = (m ? m[i] : 0) ^ x[i];
    }
  }
  return 0;
}

int crypto_stream_salsa20(u8 *c, u64 d, const u8 *n, const u8 *k) {
  return crypto_stream_salsa20_xor(c, nullptr, d, n, k);
}

int crypto_stream(u8 *c, u64 d, const u8 *n, const u8 *k) {
  u8 s[32];
  crypto_core_hsalsa20(s, n, k, sigma);
  return crypto_stream_salsa20(c, d, n + 16, s);
}

int crypto_stream_xor(u8 *c, const u8 *m, u64 d, const u8 *n, const u8 *k) {
  u8 s[32];
  crypto_core_hsalsa20(s, n, k, sigma);
  return crypto_stream_salsa20_xor(c, m, d, n + 16, s);
}

sv add1305(u32 *h, const u32 *c) {
  u32 u = 0;
  FOR(j, 17) {
    u += h[j] + c[j];
    h[j] = u & 255;
    u >>= 8;
  }
}

static const u32 minusp[17] = {5,   0,   0,   0,   0,   0,   0,   0, 0,
                               0,   0,   0,   0,   0,   0,   0, 252};

int crypto_onetimeauth(u8 *out, const u8 *m, u64 n, const u8 *k) {
  u32 s, u, x[17], r[17], h[17], c[17], g[17];
  FOR(idx, 17) {
    r[idx] = h[idx] = 0;
  }
  FOR(idx, 16) {
    r[idx] = k[idx];
  }
  r[3] &= 15;
  r[4] &= 252;
  r[7] &= 15;
  r[8] &= 252;
  r[11] &= 15;
  r[12] &= 252;
  r[15] &= 15;
  while (n > 0) {
    FOR(idx, 17) {
      c[idx] = 0;
    }
    std::size_t chunkLen = 0;
    for (; (chunkLen < 16) && (chunkLen < n); ++chunkLen) {
      c[chunkLen] = m[chunkLen];
    }
    c[chunkLen] = 1;
    m += chunkLen;
    n -= chunkLen;
    add1305(h, c);
    FOR(i, 17) {
      x[i] = 0;
      FOR(inner, 17) {
        x[i] += h[inner] * ((inner <= i) ? r[i - inner]
                                         : 320 * r[i + 17 - inner]);
      }
    }
    FOR(i, 17) {
      h[i] = x[i];
    }
    u = 0;
    FOR(idx, 16) {
      u += h[idx];
      h[idx] = u & 255;
      u >>= 8;
    }
    u += h[16];
    h[16] = u & 3;
    u = 5 * (u >> 2);
    FOR(idx, 16) {
      u += h[idx];
      h[idx] = u & 255;
      u >>= 8;
    }
    u += h[16];
    h[16] = u;
  }
  FOR(idx, 17) {
    g[idx] = h[idx];
  }
  add1305(h, minusp);
  s = -(h[16] >> 7);
  FOR(idx, 17) {
    h[idx] ^= s & (g[idx] ^ h[idx]);
  }
  FOR(idx, 16) {
    c[idx] = k[idx + 16];
  }
  c[16] = 0;
  add1305(h, c);
  FOR(idx, 16) {
    out[idx] = static_cast<u8>(h[idx]);
  }
  return 0;
}

int crypto_onetimeauth_verify(const u8 *h,
                              const u8 *m,
                              u64 n,
                              const u8 *k) {
  u8 x[16];
  crypto_onetimeauth(x, m, n, k);
  return crypto_verify_16(h, x);
}

int crypto_secretbox(u8 *c,
                     const u8 *m,
                     u64 d,
                     const u8 *n,
                     const u8 *k) {
  if (d < SECRETBOX_ZEROBYTES) {
    return -1;
  }
  crypto_stream_xor(c, m, d, n, k);
  crypto_onetimeauth(c + SECRETBOX_BOXZEROBYTES,
                     c + SECRETBOX_ZEROBYTES,
                     d - SECRETBOX_ZEROBYTES,
                     c);
  FOR(i, SECRETBOX_BOXZEROBYTES) {
    c[i] = 0;
  }
  return 0;
}

int crypto_secretbox_open(u8 *m,
                          const u8 *c,
                          u64 d,
                          const u8 *n,
                          const u8 *k) {
  if (d < SECRETBOX_ZEROBYTES) {
    return -1;
  }
  u8 x[SECRETBOX_ZEROBYTES];
  crypto_stream(x, SECRETBOX_ZEROBYTES, n, k);
  if (crypto_onetimeauth_verify(c + SECRETBOX_BOXZEROBYTES,
                                c + SECRETBOX_ZEROBYTES,
                                d - SECRETBOX_ZEROBYTES,
                                x) != 0) {
    return -1;
  }
  crypto_stream_xor(m, c, d, n, k);
  FOR(i, SECRETBOX_ZEROBYTES) {
    m[i] = 0;
  }
  return 0;
}

}  // namespace

int crypto_secretbox_easy(unsigned char *c,
                          const unsigned char *m,
                          unsigned long long mlen,
                          const unsigned char *n,
                          const unsigned char *k) {
  std::vector<u8> paddedMessage(mlen + SECRETBOX_ZEROBYTES, 0);
  std::vector<u8> paddedCipher(mlen + SECRETBOX_ZEROBYTES, 0);

  if (mlen > 0) {
    std::memcpy(
        paddedMessage.data() + SECRETBOX_ZEROBYTES, m, static_cast<std::size_t>(mlen));
  }

  if (crypto_secretbox(paddedCipher.data(),
                       paddedMessage.data(),
                       static_cast<u64>(paddedMessage.size()),
                       n,
                       k) != 0) {
    return -1;
  }

  std::memcpy(c,
              paddedCipher.data() + SECRETBOX_BOXZEROBYTES,
              static_cast<std::size_t>(mlen + SECRETBOX_MAC_BYTES));
  return 0;
}

int crypto_secretbox_open_easy(unsigned char *m,
                               const unsigned char *c,
                               unsigned long long clen,
                               const unsigned char *n,
                               const unsigned char *k) {
  if (clen < SECRETBOX_MAC_BYTES) {
    return -1;
  }

  std::vector<u8> paddedCipher(clen + SECRETBOX_BOXZEROBYTES, 0);
  std::vector<u8> paddedMessage(clen + SECRETBOX_BOXZEROBYTES, 0);

  std::memcpy(paddedCipher.data() + SECRETBOX_BOXZEROBYTES,
              c,
              static_cast<std::size_t>(clen));

  if (crypto_secretbox_open(paddedMessage.data(),
                            paddedCipher.data(),
                            static_cast<u64>(paddedCipher.size()),
                            n,
                            k) != 0) {
    return -1;
  }

  std::memcpy(m,
              paddedMessage.data() + SECRETBOX_ZEROBYTES,
              static_cast<std::size_t>(clen - SECRETBOX_MAC_BYTES));
  return 0;
}

}  // namespace tweetnacl


