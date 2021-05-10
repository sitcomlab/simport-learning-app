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
- ### [License](#license)

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
- Optional: Setup emulators as needed for testing the app on a computer
  - Within Android Studio: `Tools` → `AVD Manager`)
- Make sure to run `Sync Project with Gradle Files` before building when dependencies have changed
- Built artifact will be `./android/app/build/outputs/apk/app-debug.apk`

#### iOS

> 📝 This only works on macOS.

- Install the latest version of [XCode](https://developer.apple.com/xcode/)
- Optional: Setup emulators as needed for testing the app on a computer
  - Within XCode: `Window` → `Devices and Simulators` → `Simulators`)
- For running on physical devices, XCode requires that you’ve connected a Team to the project → [more information here](https://developer.apple.com/documentation/xcode/running-your-app-in-the-simulator-or-on-a-device)

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

Apart from basic component testing (default Angular), the testing framework is used to validate the inference algorithms.
By running the tests via `npm run test` a few simple trajectories are generated, that are designed to cover some border cases - e.g. variation in location frequency and accuracy. The creation of this test data is based on a few location files [located here](https://github.com/sitcomlab/simport-learning-app/tree/develop/dev/test-data-gpx). The generated test data is based upon the following location pattern, which result from the assumptions of a typical work day (9 to 5).

| Activity        | Start datetime       | End datetime         |
|-----------------|:--------------------:|:--------------------:|
| Dwell at home   | 2021-02-23T18:00:00Z | 2021-02-24T08:45:00Z |
| Ride to work    | 2021-02-24T08:45:00Z | 2021-02-24T09:00:00Z |
| Dwell at work   | 2021-02-24T09:00:00Z | 2021-02-24T17:00:00Z |
| Ride home       | 2021-02-24T17:00:00Z | 2021-02-24T17:15:00Z |
| Dwell at home   | 2021-02-24T17:15:00Z | 2021-02-25T08:45:00Z |

Currently the following test cases are created, analyzed and checked against the given expected inferences:

| Trajectory                  | Description      | Expected inferences |
|:---------------------------:|------------------|:-------------------:|
| Empty                       | Empty trajectory, contains no locations. | None |
| Mobile only                 | Trajectory, that only contains mobile data. Therefore it contains only the ride to and from work, but no stationary location for dwelling at home or work. |   None |
| Simple home and work        | Simple trajectory that simulates a usual day of work. The location data contains the assumed movement data stated above with typical point clouds at the dwelling locations. Without any special constraints. | Home/Work |
| Spatially dense home and work   | Similar to simple home/work, but stationary data (point clouds for dwelling time) is way more spatially dense, which simulates a lot of movement/higher update frequency during recording.| Home/Work |
| Temporally sparse home and work | Similar to simple home/work, but stationary data (point clouds for dwelling time) is way more temporally sparse, which simulates a less movement/lower update frequency during recording.| Home/Work |

These tests are automatically executed when pushing to the development branch. The last test-result can be seen at the top of this page.

## License 

```
SIMPORT Learning App
Copyright (c) 2020 Sitcom Lab
```
[Further information](https://github.com/sitcomlab/simport-learning-app/blob/develop/LICENSE)

[simport]: https://simport.net/
[ionic]: https://ionicframework.com/
[capacitor]: https://capacitorjs.com/
[angular]: https://angular.io/
[firebase]: https://firebase.google.com
[node]: https://nodejs.org/
