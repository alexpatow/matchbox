# Native packages

The training package bundles prebuilt Node-API binaries. Installing Matchbox does not download executables from GitHub, run an install script, or compile Rust. The loader selects the binary for the operating system, CPU architecture and Linux libc. Browser inference continues to use the separate WASM asset in the core package.

## Platform coverage

The build and installed-package checks run on these targets:

| Platform    | Architectures | Verification environment  |
| ----------- | ------------- | ------------------------- |
| macOS       | x64 and ARM64 | macOS 15.                 |
| Linux glibc | x64 and ARM64 | Ubuntu 22.04.             |
| Linux musl  | x64 and ARM64 | Node 24 Alpine container. |
| Windows     | x64           | Windows Server 2025.      |
| Windows     | ARM64         | Windows 11 ARM.           |

Node 24 runs the installed-package checks on every target. Bun checks additionally run on macOS, glibc Linux and Windows x64. This matrix does not claim Bun support on Windows ARM64 or Alpine. Older operating systems and other architectures are outside the verified support matrix.

All binaries ship inside @matchbox-ai/train. This increases the development dependency's download size, but keeps installation independent of optional dependencies and install-script permissions. These binaries do not enter the browser bundle.

## Building and verifying

`scripts/native-targets.json` defines the supported targets and artifact names. The native workflow compiles each target, then exercises sequence and record training through its loader. Musl builds use a dynamic C runtime and run in Alpine rather than being tested against glibc.

The packed-package workflow assembles all binaries, packs the three npm packages, and installs those archives in isolated directories with `--ignore-scripts`. It trains through @matchbox-ai/train and runs the generated model, including WASM inference. These directories contain no Rust sources or build output. Every target must pass before the release pack job runs.

The release workflow also checks that all eight binaries are present before Changesets packs. Model binaries and generated WASM remain ignored by Git. Contributors still need Rust to build from source; package consumers do not.

Run `bun run build:rust` for the local platform. A missing platform binary produces a loader error identifying the operating system, architecture and libc. There is no automatic compilation fallback.

The packaging convention follows [prebuild's bundled distribution](https://github.com/prebuild/prebuildify) and uses [node-gyp-build](https://github.com/prebuild/node-gyp-build) only as a loader.
