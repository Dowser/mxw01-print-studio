# Security policy

## Scope

The local web terminal is intended for development on the same computer as the
printer. It binds to loopback, validates request origins, blocks private
addresses for webpage import and requires a fresh preflight before printing.
Do not expose it on a LAN or the public internet without adding an
authenticated deployment boundary.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for
[`Dowser/mxw01-print-studio`](https://github.com/Dowser/mxw01-print-studio/security)
when available. Do not publish Bluetooth identifiers, credentials, private
URLs or a working exploit in a public issue. If private reporting is not
available, open a minimal issue asking for a private contact channel and omit
those details.
