---
title: Windows Installation
sidebar_label: Windows Installation
---

To install the Ionic Couchbase Lite integration into Capacitor Windows, first follow the [Installation](./installation) guide to install the `@ionic-enterprise/couchbase-lite` package. Note: the instructions below only apply to version `1.3.0` and above.

Then, run:

```shell
npx cap sync @ionic-enterprise/capacitor-windows
```

## Open in Visual Studio

Open your project in visual studio by running

```shell
npx cap open @ionic-enterprise/capacitor-windows
```

This will attempt to automatically locate your Visual Studio 2022 or 2019 installation, in that order. If your installation is in a non-standard location, set the `CAPACITOR_VISUAL_STUDIO_PATH` environment variable to the location of `devenv.exe` for your Visual Studio install, and then re-run the above command.

## Install the Plugin in Visual Studio

Open the Package Manager Console:

![Package Manager Console](/img/couchbase-lite/package-manager-console.png)

Then run:

```shell
Install-Package IonicCouchbaseLite -ProjectName App
Install-Package Couchbase.Lite.Enterprise -Version 2.8.6 -ProjectName App
```

## Installation Complete

The plugin should now be installed in your project. Rerun the above commands to update the package in the future.
