# MXW01 cross-platform conformance vectors

This directory is intentionally language-neutral. Web/TypeScript tests and a
future Swift package should consume the same vectors before claiming protocol
or raster compatibility.

The current vector set covers:

- MXW01 command framing, little-endian payload lengths, CRC8 and terminator;
- the 384-dot, LSB-first, black-is-one raster convention;
- the distinction between content rows and the 90-row minimum wire payload.

TypeScript verifies these vectors through the conformance scripts, and the
Swift package verifies the fingerprint, command framing and raster packing
rules in `swift/Tests/MXW01CoreTests`.

The frame format is represented as lowercase hexadecimal bytes separated by
spaces. The 90-row padding is a firmware compatibility rule inherited from
the original implementation and should be verified against captured hardware
traffic before another printer profile copies it.
