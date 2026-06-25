<div align="center">

<p align="center">
  <picture>
    <img
      src="./assets/delta_logo.png"
      alt="Delta"
      width="450"
    />
  </picture>
</p>

### **Ship the change. Not the bundle.**

### The next generation of runtime updates for React Native.

---

**delta** is a production-ready **patch-based runtime update platform** for React Native that enables you to ship bug fixes, performance improvements, and new features instantly—without waiting for App Store or Play Store approvals.

Unlike traditional OTA solutions that download and replace the entire JavaScript bundle, **delta generates and applies lightweight binary patches**, delivering **only what changed**. The result is dramatically smaller downloads, faster update adoption, lower bandwidth consumption, and a seamless update experience for your users.

<br/>

<img src="https://img.shields.io/badge/⚡_Smaller_Downloads-EAF2FF?style=for-the-badge&labelColor=EAF2FF&color=EAF2FF" />
<img src="https://img.shields.io/badge/🚀_Faster_Rollouts-E9F8EC?style=for-the-badge&labelColor=E9F8EC&color=E9F8EC" />
<img src="https://img.shields.io/badge/📦_Delta_Patching-EDE7FF?style=for-the-badge&labelColor=EDE7FF&color=EDE7FF" />
<img src="https://img.shields.io/badge/📈_Better_Adoption-FDEFE7?style=for-the-badge&labelColor=FDEFE7&color=FDEFE7" />

</div>


---

## Why delta?

Traditional OTA platforms replace the **entire JavaScript bundle** every time you publish an update—even if you've changed only a few lines of code.

Delta takes a fundamentally different approach.

Using intelligent **binary delta patching**, it computes the difference between releases and delivers only the bytes required to transform one version into another. This significantly reduces update sizes, accelerates deployments, and helps users stay on the latest version with minimal data usage.

## What does the CLI do?

The delta-cli is the developer interface to the Delta ecosystem, streamlining the complete runtime update workflow from your terminal.

- 📦 **Create Releases** by packaging your React Native application for deployment.
- Δ **Generate Binary Delta Patches** between releases, ensuring users download only what has changed.
- 🚀 **Publish Updates** to your Delta Server with a single command.
- 🎯 **Manage Deployments** across environments, release channels, and native app versions.
- 🔄 **Automate CI/CD Pipelines** by integrating seamlessly with GitHub Actions, Bitrise, CircleCI, Codemagic, Azure DevOps, Jenkins, and other automation platforms.
- 📊 **Manage Release Metadata** including release versions, patch relationships, deployment history, and update information.
- 🔐 **Securely Authenticate** with your Delta Server and publish production-ready runtime updates.

Whether you're shipping a critical hotfix or your next major feature, Delta CLI provides a fast, reliable, and repeatable deployment experience.

> **Ship only the difference. Deliver updates that users barely notice—but always appreciate.**

## Related Repositories

This CLI is one part of the Delta platform. It works alongside:


| Repository                                                             | Description                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| [react-native-delta](https://github.com/zepto-labs/react-native-delta) | React Native SDK for receiving and applying OTA updates         |
| [delta-server](https://github.com/zepto-labs/delta-server)             | Backend server for patch delivery, releases, and the update API |


## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
  - [createBundleRelease](#createbundlerelease)
  - [updateRelease](#updaterelease)
  - [listReleases](#listreleases)
  - [listRegistries](#listregistries)
  - [createRegistry](#createregistry)
  - [invalidateCache](#invalidatecache)
- [Contributing](#contributing)
- [Security](#security)
- [Third-Party Licenses](#third-party-licenses)

## Prerequisites

- **Node.js** 18 or newer.
- **AWS credentials** configured (e.g. AWS CLI profile) with permission to invoke the Delta Lambda functions and access the Delta S3 bucket.
- For `**createBundleRelease`**: a React Native project with Hermes enabled and platform-specific env variables set (see [Environment Variables](#environment-variables)).

## Installation

Using yarn:

```sh
yarn add -D @zepto-labs/delta-cli
```

Using npm:

```sh
npm install --save-dev @zepto-labs/delta-cli
```

After installation, the CLI is available as `delta-cli` via `yarn delta-cli`, `npx delta-cli`, or directly if globally linked.

## Configuration

The CLI requires a `delta.config.json` file in your project root. This file provides the AWS resource configuration needed by the CLI.

> **Note:** The S3 bucket referenced below must either be publicly readable or fronted by a CDN for bundle download URLs to work at runtime.

```json
{
  "s3": {
    "bucket": "your-delta-bucket",
    "region": "your-region"
  },
  "lambda": {
    "region": "your-region",
    "getLatestPatch": "<Your Function Name from backend>",
    "getReleaseList": "<Your Function Name from backend>",
    "createRelease": "<Your Function Name from backend>",
    "updateRelease": "<Your Function Name from backend>",
    "getRegistryList": "<Your Function Name from backend>",
    "createRegistry": "<Your Function Name from backend>",
    "invalidateCache": "<Your Function Name from backend>"
  }
}
```


| Key                      | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `s3.bucket`              | S3 bucket name for storing bundle and patch artifacts.      |
| `s3.region`              | AWS region of the S3 bucket.                                |
| `lambda.region`          | AWS region where Lambda functions are deployed.             |
| `lambda.getLatestPatch`  | Lambda function name for fetching the latest patch version. |
| `lambda.getReleaseList`  | Lambda function name for listing releases.                  |
| `lambda.createRelease`   | Lambda function name for creating a release record.         |
| `lambda.updateRelease`   | Lambda function name for updating a release.                |
| `lambda.getRegistryList` | Lambda function name for listing registered apps.           |
| `lambda.createRegistry`  | Lambda function name for registering a new app.             |
| `lambda.invalidateCache` | Lambda function name for CDN cache invalidation.            |


## Usage

```sh
yarn delta-cli <command> [options]
```

Each command accepts its own set of options (flags). All flags are passed **after** the command name.

---

## Commands

---

### `createBundleRelease`

Builds a production Hermes bytecode bundle from your React Native project, generates binary diff patches against previous releases, uploads all artifacts to S3, and registers a new release via the Delta API.

#### Options


| Option            | Short | Type    | Required | Description                                                                                   |
| ----------------- | ----- | ------- | -------- | --------------------------------------------------------------------------------------------- |
| `--platform`      |       | string  | Yes      | Target platform. Must be `android` or `ios`.                                                  |
| `--entryFile`     |       | string  | Yes      | Path to the React Native entry file (passed to `react-native bundle --entry-file`).           |
| `--pushToStaging` | `-P`  | boolean | No       | If set, the release is created in **staging** state instead of the default **created** state. |
| `--description`   | `-m`  | string  | No       | A human-readable description stored alongside the release.                                    |


#### Notes

> `**--entryFile` value depends on your codebase.** If your project has separate entry files per platform (e.g. `index.android.js` for Android and `index.js` for iOS), pass the one that matches `--platform`. If you have a single `index.js`, use that for both platforms.

#### Examples

```sh
# Android release (separate entry file)
yarn delta-cli createBundleRelease --platform android --entryFile index.android.js

# iOS release (shared entry file)
yarn delta-cli createBundleRelease --platform ios --entryFile index.js

# Push directly to staging
yarn delta-cli createBundleRelease --platform android --entryFile index.android.js -P
```

---

### `updateRelease`

Modifies an **existing** release. Use this to change the rollout percentage, transition the release state (e.g. from staging to live), or mark a release as the default.

You must specify at least one of `--rollout`, `--releaseState`, or `--defaultRelease`.

#### Options


| Option             | Short | Type   | Required | Description                                                                                          |
| ------------------ | ----- | ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `--platform`       |       | string | Yes      | Target platform (`android` or `ios`). Used to resolve `appId` from env if `--appId` is not provided. |
| `--jsVersion`      | `-j`  | number | Yes      | The JS version of the release to update.                                                             |
| `--bundleVersion`  | `-b`  | number | Yes      | The bundle version of the release to update.                                                         |
| `--rollout`        | `-r`  | number | No*      | New rollout percentage (0-100).                                                                      |
| `--releaseState`   | `-s`  | number | No*      | New release state value. See [Release States](#release-states) below.                                |
| `--defaultRelease` | `-d`  | string | No*      | Set to `true` or `false` to mark/unmark as the default release.                                      |
| `--appId`          | `-a`  | string | No       | Delta app id. Falls back to env variable for the given platform if omitted.                          |


>  At least one of `--rollout`, `--releaseState`, or `--defaultRelease` is required.

#### Release States


| Value | State    | Description                                                |
| ----- | -------- | ---------------------------------------------------------- |
| `0`   | CREATED  | Initial state when a release is first created.             |
| `10`  | STAGING  | Only available to internal users for testing.              |
| `20`  | LIVE     | Available to end users.                                    |
| `30`  | DISABLED | Disabled for updates; can be moved back to LIVE.           |
| `40`  | DELETED  | Invalid or corrupted build; cannot be moved to LIVE again. |


#### Examples

```sh
# Set rollout to 100%
yarn delta-cli updateRelease --platform android -a my-app-id -j 1 -b 2 -r 100

# Move release to live state
yarn delta-cli updateRelease --platform ios -a my-app-id -j 3 -b 1 -s 20

# Mark as default release
yarn delta-cli updateRelease --platform android -a my-app-id -j 1 -b 5 -d true
```

---

### `listReleases`

Fetches and displays all releases (and their patches) for a given app. Outputs a formatted table to the console.

#### Options


| Option        | Short | Type   | Required | Description                              |
| ------------- | ----- | ------ | -------- | ---------------------------------------- |
| `--appId`     | `-a`  | string | Yes*     | Delta app id to list releases for.       |
| `--jsVersion` | `-j`  | number | No       | Filter results to a specific JS version. |


>  If `--appId` is not provided, the CLI falls back to the `DELTA_ID` environment variable.

#### Examples

```sh
# List all releases for an app
yarn delta-cli listReleases -a my-app-id

# Filter by JS version
yarn delta-cli listReleases -a my-app-id -j 2
```

---

### `listRegistries`

Fetches and displays all registered apps in a formatted table. No options are required.

#### Options

*None.*

#### Examples

```sh
yarn delta-cli listRegistries
```

---

### `createRegistry`

Registers a new app with Delta. Each app is identified by a unique id, a display name, and a platform.

#### Options


| Option       | Short | Type   | Required | Description                                                   |
| ------------ | ----- | ------ | -------- | ------------------------------------------------------------- |
| `--appId`    | `-a`  | string | Yes      | Unique identifier for the new app.                            |
| `--appName`  |       | string | Yes      | Human-readable display name for the app.                      |
| `--platform` |       | string | Yes      | Platform this registry entry represents (`android` or `ios`). |


#### Examples

```sh
yarn delta-cli createRegistry -a my-app-id --appName "My App" --platform android
yarn delta-cli createRegistry -a my-app-id-ios --appName "My App iOS" --platform ios
```

---

### `invalidateCache`

Triggers a CDN / cache invalidation for the specified cache type. Useful after publishing a release to ensure clients fetch fresh data immediately.

#### Options


| Option        | Short | Type   | Required | Description                                  |
| ------------- | ----- | ------ | -------- | -------------------------------------------- |
| `--cacheType` |       | string | Yes      | Which cache to invalidate. See values below. |


#### `--cacheType` values


| Value          | Description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| `ALL`          | Invalidates all supported caches at once.                                        |
| `CHECK_UPDATE` | Invalidates the check-update endpoint cache (clients checking for new releases). |
| `GET_REGISTRY` | Invalidates the registry endpoint cache.                                         |
| `RELEASE_LIST` | Invalidates the release-list endpoint cache.                                     |


#### Examples

```sh
# Invalidate everything
yarn delta-cli invalidateCache --cacheType ALL

# Only invalidate the update-check cache
yarn delta-cli invalidateCache --cacheType CHECK_UPDATE
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding conventions, and how to submit changes.

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## Third-Party Licenses

This project depends on the following third-party packages. See each package's license for terms and conditions.


| Package                                                                        | Version  | License                                                                       | License Changed? |
| ------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------- | ---------------- |
| [@aws-sdk/client-lambda](https://www.npmjs.com/package/@aws-sdk/client-lambda) | 3.967.0  | [Apache-2.0](https://github.com/aws/aws-sdk-js-v3/blob/main/LICENSE)          | No               |
| [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3)         | 3.967.0  | [Apache-2.0](https://github.com/aws/aws-sdk-js-v3/blob/main/LICENSE)          | No               |
| [@types/adm-zip](https://www.npmjs.com/package/@types/adm-zip)                 | ^0.5.5   | [MIT](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/LICENSE) | No               |
| [@types/node](https://www.npmjs.com/package/@types/node)                       | ^20.12.7 | [MIT](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/LICENSE) | No               |
| [adm-zip](https://www.npmjs.com/package/adm-zip)                               | ^0.5.12  | [MIT](https://github.com/cthackers/adm-zip/blob/master/LICENSE)               | No               |
| [bsdiff-node](https://www.npmjs.com/package/bsdiff-node)                       | ^2.5.0   | [MIT](https://github.com/Brouilles/bsdiff-node/blob/master/LICENSE)           | No               |
| [chalk](https://www.npmjs.com/package/chalk)                                   | ^4.1.2   | [MIT](https://github.com/chalk/chalk/blob/main/license)                       | No               |
| [dotenv](https://www.npmjs.com/package/dotenv)                                 | 16.4.5   | [BSD-2-Clause](https://github.com/motdotla/dotenv/blob/master/LICENSE)        | No               |
| [lint-staged](https://www.npmjs.com/package/lint-staged)                       | 15.2.2   | [MIT](https://github.com/okonet/lint-staged/blob/master/LICENSE)              | No               |
| [prettier](https://www.npmjs.com/package/prettier)                             | 3.2.5    | [MIT](https://github.com/prettier/prettier/blob/main/LICENSE)                 | No               |
| [typescript](https://www.npmjs.com/package/typescript)                         | 5.2.2    | [Apache-2.0](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt)   | No               |


## Credits

- [Kushagra Gupta](https://www.linkedin.com/in/kushagra-gupta-67384ba7/)
- [Amit Mundra](https://www.linkedin.com/in/amit-mundra-17201bba/)
- [Zubin Paul](https://www.linkedin.com/in/zubin-paul)
- [Saiyam Arora](https://www.linkedin.com/in/saiyam-arora-0b5107215/)

### Special Thanks

- [Nikhil Mittal](https://www.linkedin.com/in/nikhilkmittal/)