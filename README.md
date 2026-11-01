# Veyra

An offline-first 2D/3D design studio for indoor spaces and floor plans.

## Current implementation
React, TypeScript, Three.js, Vite; 2D/3D editing UI and multiple projects are in the existing codebase. Projects are currently autosaved using browser localStorage. **Do not clear application data without exporting backups.**

## Windows 10 desktop
Prerequisites for development: Node.js 22+, Rust stable, Windows C++ build tools, and WebView2. Run:

```powershell
npm install
npm run desktop:dev
```

To produce the offline installer:
```powershell
npx tauri icon public/veyra.svg
npm run desktop:build
```
Output: `src-tauri/target/release/bundle/nsis/`.

The installer embeds the WebView2 offline installer. End users do not need an external server. Development tools may require internet during initial installation.

## Mobile
The existing web UI can be adapted for responsive use. Native mobile packaging, touch testing, and mobile releases are **not completed** by this desktop foundation. No claim is made that feature parity or performance has been verified on phones.

## Local data and limitations
The existing storage is localStorage, not a robust native project-file backend. Export project backups frequently until migration, schema versioning, and native save/open dialogs are implemented. Do not promise lossless migration without tests.

No Gemini API, Cloud Run endpoint, or Google-hosted font is required by the shell. Audit remaining runtime assets before claiming a fully isolated environment.

## CI
The Windows desktop workflow typechecks, builds, generates icons, bundles an offline installer, and uploads its artifact. Check the GitHub Actions outcome; a workflow file alone does not guarantee a successful build.

## Project status
Desktop build foundation: proposed, pending CI validation and real Windows 10 testing.
2D/3D behavior, responsiveness, exact measurement fidelity, persistence recovery, and performance: require further acceptance tests.
