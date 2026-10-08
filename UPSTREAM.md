# Upstream history

`mxw01-print-studio` is a downstream fork, not a replacement for the original
project. The GitHub fork relationship is kept at
[`Dowser/mxw01-print-studio`](https://github.com/Dowser/mxw01-print-studio),
whose parent is [`clementvp/mxw01-thermal-printer`](https://github.com/clementvp/mxw01-thermal-printer).

At publication time the downstream branch starts from upstream commit:

```text
ead9a022f0de96b96844ea0e8737bbfdda0518ef  first release
```

The local remotes are deliberately explicit:

```text
origin   https://github.com/Dowser/mxw01-print-studio.git
upstream https://github.com/clementvp/mxw01-thermal-printer.git
```

To inspect new upstream work without rewriting downstream history:

```bash
git fetch upstream
git log --oneline --decorate --graph upstream/main
git diff upstream/main...HEAD
```

Downstream changes should be made on topic branches and merged through the
public repository. Do not squash away the upstream base or copy code from the
AGPL protocol-reference repository into this MIT-licensed tree.
