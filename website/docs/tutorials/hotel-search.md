---
title: Hotel Search Tutorial
sidebar_label: Hotel Search
---

Learn how to build an Angular app with Capacitor that allows users to search and bookmark hotels using data loaded from a Couchbase Lite database. The complete reference app is available [here](https://github.com/ionic-team/demo-couchbaselite-hotels).

After completing the tutorial, you'll have created an app that:
* Loads and stores data, including bookmarked hotels, in a Couchbase Lite database.
* Uses UI components from Ionic: search bar, bookmarks, icons, list items, and more.
* Runs on iOS, Android, and native Windows apps all from the same codebase.

Here's a sneak peek at what we're building:

TODO

## Setup

Begin by installing the Ionic CLI then creating an Ionic app:

```shell
npm install -g @ionic/cli
ionic start
```

In this tutorial, we'll choose the "tabs" starter template, but any template will suffice. Next, install Capacitor, Ionic's native runtime tool for building cross-platform web native apps:

```shell
# Add Capacitor along with iOS and Android native projects
ionic integrations enable capacitor
npx capacitor add ios
npx capacitor add android
```

## Integrate Couchbase Lite

With the application setup, it's time to add the Couchbase Lite solution:

```shell
npm install @ionic-enterprise/couchbase-lite
npx cap sync
```

Next, create a model class to represent `Hotel` data:

```typescript
export class Hotel {
  id?: number;
  name: string;
  address: string;
  phone: string;
  bookmarked: boolean = false;
}
```

It's recommended to create a service that encapsulates all Couchbase Lite functionality, so create it:

```shell
ionic generate service services/database
```

Within `database.service.ts`, import the Couchbase Lite integration and the new `Hotel` model:

```typescript
import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import {
  Database,
  DatabaseConfiguration,
  DataSource,
  Meta,
  MutableDocument,
  Ordering,
  QueryBuilder,
  SelectResult,
  Expression
} from '@ionic-enterprise/couchbase-lite';
import { Hotel } from '../models/hotel';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService { }
```

### Initialize the Database


## Retrieve Hotel Data

todo: cb load hotel data from cb db

### Display Hotel Data

We'll create the hotel search experience on the tab1 page. Open `src/app/tab1/tab1.page.ts` then import the `DatabaseService`. Retrieve the hotel data when the page first loads.

```typescript
import { Component } from '@angular/core';
import { Hotel } from '../models/hotel';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  hotels: Hotel[] = [];
  hotelsDisplayed: Hotel[] = [];

  constructor(private databaseService: DatabaseService) {}

  async ngOnInit() {
    this.hotels = await this.databaseService.getHotels();
    this.hotelsDisplayed = this.hotels;
  }
}
```

To display the hotels on the `tab1.page.html` page, use the `ion-list` component:

```html
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title>Hotels</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-title size="large">Hotels</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-list>
    <ion-item *ngFor="let hotel of hotelsDisplayed;">
      <ion-label>
        <h2>{{ hotel.name }}</h2>
        <p>{{ hotel.address }}</p>
        <p>{{ hotel.phone }}</p>
      </ion-label>
    </ion-item>
  </ion-list>
</ion-content>
```

With this code added, a list of all hotels are displayed on the page.

## Search Hotels


### Search bar



## Bookmark Hotels
