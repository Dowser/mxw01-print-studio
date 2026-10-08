# MXW01 Print Studio notices

## Project license

The project code is distributed under the MIT License in [`LICENSE`](LICENSE).
This downstream repository retains the copyright and attribution of the
upstream project and adds the downstream Print Studio contributions under the
same license. Third-party files and references listed below keep their own
license terms.

## Upstream project

This repository is a public fork of
[`clementvp/mxw01-thermal-printer`](https://github.com/clementvp/mxw01-thermal-printer),
originally authored by [Clément Van Peuter](https://github.com/clementvp).
The upstream history is intentionally preserved. See [`UPSTREAM.md`](UPSTREAM.md)
for the remotes and base commit used when this fork was published.

## MXW01 protocol references

The MXW01 protocol was identified and validated using the following public
projects. Their names and links are retained here for research attribution;
this repository does not relicense or incorporate their source code.

- [`dropalltables/catprinter`](https://github.com/dropalltables/catprinter) —
  AGPL-3.0. Its public protocol documentation was consulted; no AGPL source
  file is included in this repository.
- [`jeremy46231/MXW01-catprinter`](https://github.com/jeremy46231/MXW01-catprinter) —
  MIT, carrying the upstream `Copyright (c) 2021 rbaron` notice and identifying
  itself as a fork of [`rbaron/catprinter`](https://github.com/rbaron/catprinter).
  The TypeScript and Swift protocol/transport implementations here are
  independently structured and tested against the shared conformance vectors.
- [`mxw01.online`](https://mxw01.online/) — referenced as a UX/product
  inspiration for the local terminal. No site code or visual assets are
  redistributed here.

Protocol facts and wire-format behavior are documented as interoperability
information, not copied program text. If a future contribution imports code
from one of these projects, it must preserve that project's license and add a
file-specific notice before merging.

## Font Awesome Free

The web terminal bundles a subset of Font Awesome Free 6.7.2:

- [`web/vendor/fontawesome/fa-solid-900.woff2`](web/vendor/fontawesome/fa-solid-900.woff2)
  is a Font Awesome web font and is licensed under the SIL Open Font License
  1.1.
- [`web/vendor/fontawesome/fontawesome.css`](web/vendor/fontawesome/fontawesome.css)
  is the project-specific CSS subset and is licensed under the Font Awesome
  Free code terms (MIT).
- [`src/core/iconShapes.ts`](src/core/iconShapes.ts) contains the selected
  icon path data, licensed under CC BY 4.0.

Copyright for these Font Awesome assets belongs to Fonticons, Inc. The complete
Font Awesome Free terms are included in
[`web/vendor/fontawesome/LICENSE.txt`](web/vendor/fontawesome/LICENSE.txt) and
are also available at [fontawesome.com/license/free](https://fontawesome.com/license/free).

## Dependency licenses

The npm lockfile records the licenses and exact versions of the development
dependencies. Optional runtime adapters such as `@stoprocent/noble` retain
their own upstream licenses and are not bundled into the published package.
