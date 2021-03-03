# SIMPORT Learning App

learning tool on location privacy

> **status**: prototyping

> this is part of the [SIMPORT][simport] project

## development

This is an hybrid [Ionic][ionic] app, using Capacitator (a drop-in replacement
for Cordova) to access native APIs and [Angular][angular] for UI.

### version control

We use `develop` as the main branch and build features on feature branches `feature/<feature name>`, merging into `develop`.For your commits, please use the following commit message if applicable: `#<issue number>: <commit message>`

Releases are automatically triggered on push to `release-beta` using GitHub Actions & Firebase.

### dev env setup

For basic UI development you'll only need [node.js][node] installed.
Then run:

```sh
git clone git@github.com:sitcomlab/simport-learning-app
cd simport-learning-app
npm install -g @ionic/cli # install the ionic CLI, which is used for most management tasks
npm install               # install the frontend dependencies
```

#### build for Android

- install [Android Studio][android]
  - on linux, install to `/opt/android-studio/`, as this path is configured in `capacitor.config.json`
- download Android SDK 29 (android studio settings > appearance > system settings > Android SDK)
- build artifact will be `./android/app/build/outputs/apk/app-debug.apk`

#### build for iOS

TBD

### run & build

```sh
# hot reloading server
ionic serve

# build frontend to ./www/
ionic build

# prepare android build & open AndroidStudio to start the build there
ionic cap build android

# ...same for iOS / XCode
ionic cap build ios
```

> NOTE: with Capacitor, the native build projects are supposed to be checked into version control!
> This avoids duplicate config and simplifies writing native code without creating plugins.

### test

tbd

[simport]: https://simport.net/
[android]: https://developer.android.com/studio/install
[ionic]: https://ionicframework.com/
[angular]: https://angular.io/
[node]: https://nodejs.org/
