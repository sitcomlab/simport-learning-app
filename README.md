# SIMPORT Learning App  &middot; <a href="https://github.com/sitcomlab/simport-learning-app/actions/workflows/build-android.yml"><img src="https://github.com/sitcomlab/simport-learning-app/actions/workflows/build-android.yml/badge.svg"></a> <a href="https://github.com/sitcomlab/simport-learning-app/actions/workflows/build-ios.yml"><img src="https://github.com/sitcomlab/simport-learning-app/actions/workflows/build-ios.yml/badge.svg"></a> <a href="https://github.com/sitcomlab/simport-learning-app/actions/workflows/run-tests.yml"><img src="https://github.com/sitcomlab/simport-learning-app/actions/workflows/run-tests.yml/badge.svg"></a>

</br>

[![](https://simport.net/wp-content/uploads/2020/07/simport_bmbf_logo.png)](https://simport.net/)

-------------------------------------------------------------------------------
Learning tool on location data privacy, that reflects to users, what conclusions can be drawn from their location histories. It is used to record location data over a timespan and analyzing that locally to create inferences - e.g. about where the user might work or live. The app works completely autonomously and doesn't need any internet connection whatsoever. This is part of the [SIMPORT][simport] project.

> **Status**: prototyping 🛠️

## Contents
- ### [Description](#description)
- ### [Development](#development)
  - [Version Control](#version-control)
  - [Setup](#setup)
    - [Android](#android)
    - [iOS](#ios)
  - [Build & Run](#build-and-run)
  - [Test](#test)

## Development

This is an hybrid [Ionic][ionic] app, using [Capacitator][capacitor] (a drop-in replacement
for Cordova) to access native APIs and [Angular][angular] for UI.

### Version Control

The branch `develop` is used as the main branch, while actual developing of new features is done on individual feature branches

`feature/<feature name>`

These feature branches are merged `develop` when finished. For your commits, please use the following commit message if applicable:

  `#<issue number>: <commit message>`

Releases are automatically triggered on push to `release-beta` using [GitHub Actions](https://github.com/sitcomlab/simport-learning-app/tree/develop/.github/workflows) and distributed to a closed group of beta-testers using [Firebase][firebase].

### Setup

For basic UI development you need [node.js][node] installed - [see here](https://nodejs.org/de/download/package-manager/) for further information.
As an IDE you can basically choose by your own taste. Recommendation: [Visual Studio Code](https://code.visualstudio.com) using the code formatter [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) with [these settings](https://github.com/sitcomlab/simport-learning-app/blob/develop/.prettierrc.json).

##### Clone the repository
```sh
git clone git@github.com:sitcomlab/simport-learning-app
```
##### Within the repository, install the ionic CLI, which is used for most management tasks, as well as the frontend dependencies
```sh
cd simport-learning-app
npm install -g @ionic/cli # install the ionic CLI
npm install               # install the frontend dependencies
```

#### Android

- Install the latest version of [Android Studio](https://developer.android.com/studio/install)
  - on Linux, install to `/opt/android-studio/`, as this path is configured in `capacitor.config.json`
- Download an up-to-date Android SDK (e.g. SDK 29)
  - Within Android Studio: `Tools` → `SDK Manager`)
- Optional: Setup emulators, for testing the app on a computer
  - Within Android Studio: `Tools` → `AVD Manager`)
- Make sure to run `Sync Project with Gradle Files` before building when dependencies have changed
- Built artifact will be `./android/app/build/outputs/apk/app-debug.apk`

#### iOS

> 📝 This only works on macOS.

- Install the latest version of [XCode](https://developer.apple.com/xcode/)
- TBD

> 📝 With [Capacitor][capacitor], the native build projects are supposed to be checked into version control.
> This avoids duplicate config and simplifies writing native code without creating plugins.

### Build and Run

##### Hot Reloading Server
```sh
ionic serve
```
##### Build frontend to ./www/
```sh
ionic build
```
##### Prepare Android build & open Android Studio
```sh
ionic cap update
ionic cap build android
```
##### Prepare iOS build & open XCode
```sh
ionic cap update
ionic cap build ios
```

### Test

TBD

[simport]: https://simport.net/
[ionic]: https://ionicframework.com/
[capacitor]: https://capacitorjs.com/
[angular]: https://angular.io/
[firebase]: https://firebase.google.com
[node]: https://nodejs.org/
