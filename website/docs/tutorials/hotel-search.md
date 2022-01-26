---
title: Hotel Search Tutorial
sidebar_label: Hotel Search
---

Learn how to build an Angular app with Capacitor that allows users to search and bookmark hotels using data loaded from a Couchbase Lite database. The complete reference app is [available here](https://github.com/ionic-team/demo-couchbaselite-hotels).

By completing this tutorial, you'll create an app that:
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
// src/app/data/hotels.ts
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
// src/app/services/database.service.ts
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

todo: load hotel data from cb db

### Display Hotel Data

We'll create the hotel search experience on the tab1 page. Open `tab1.page.ts` then import the `DatabaseService`. Retrieve the hotel data when the page first loads.

```typescript
// src/app/tab1/tab1.page.ts
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
<!-- src/app/tab1/tab1.page.html -->
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

Now that all hotels are displayed, we can build some interactive features such as a search function. Open `database.service.ts` then create a `searchHotels` function. First, build a N1QL query that searches the Couchbase Lite database for hotels that match the provided hotel name the user will enter into a search bar. Return the list of filtered hotels back to the UI layer:

```typescript
public async searchHotels(name) {
 // todo
}
```

Over in `tab1.page.html`, add an `ion-searchbar` search bar component above the `ion-list`. The `ionChange` event fires each time the user enters new text into the search bar. 

```html
<!-- src/app/tab1/tab1.page.html -->
<ion-searchbar placeholder="Search Name..." 
               (ionChange)="searchQueryChanged($event.target.value)">
</ion-searchbar>
```

Within `searchQueryChanged`, pass along the hotel name string into the database service. Since `hotelsDisplayed` represents the array of filtered list of hotels to display to the end user, the UI will update automatically after each character is typed by the user.

```typescript
// src/app/tab1/tab1.page.ts
async searchQueryChanged(hotelName) {
  this.hotelsDisplayed = await this.databaseService.searchHotels(hotelName);
}
```

## Bookmark Hotels

The final feature we'll add is the ability to bookmark hotels that the user is interested in staying at. This includes saving the bookmark data in Couchbase Lite as well as offering the ability to toggle between all hotels and bookmarked hotels in the UI. 

### Retrieve Bookmark Data

First, add a call to `findOrCreateBookmarkDocument()` in the initialize method:

```typescript
// src/app/services/database.service.ts
private async initializeDatabase() {
  // snip - other code

  // Create the "bookmarked_hotels" document if it doesn't exist
  this.bookmarkDocument = await this.findOrCreateBookmarkDocument();

  // snip - other code
}
```

The bookmarked hotels will be stored in a Couchbase Lite document as an array of hotel ids. Next, implement the method which will retrieve the bookmark document or create it if it doesn't exist.

```typescript
// src/app/services/database.service.ts
private async findOrCreateBookmarkDocument(): Promise<MutableDocument> {
  const query = QueryBuilder.select(SelectResult.expression(Meta.id))
    .from(DataSource.database(this.database))
    .where(Expression.property("type").equalTo(Expression.string(this.DOC_TYPE_BOOKMARKED_HOTELS)));

    const resultSet = await query.execute();
    const resultList = await resultSet.allResults();

    if (resultList.length === 0) {
      const mutableDocument = new MutableDocument()
              .setString("type", this.DOC_TYPE_BOOKMARKED_HOTELS)
              .setArray("hotels", new Array());
      this.database.save(mutableDocument);
      return mutableDocument;
    } else {
      const result = resultList[0];
      const docId = result.getString("id");
      return MutableDocument.fromDocument(await this.database.getDocument(docId));
  }
}
```

Next, update the `retrieveHotelList()` method to toggle the `bookmarked` hotel property if the hotel's id is found in the bookmarked hotels document. The `bookmarked` boolean property determines whether to display the hotel as bookmarked for later review in the UI.

```typescript
// src/app/services/database.service.ts
private async retrieveHotelList(): Promise<Hotel[]> {
  let bookmarks = this.bookmarkDocument.getArray("hotels");
  let hotelList: Hotel[] = [];
  for (let key in hotelResults) {
    // Set bookmark status
    let singleHotel = hotelResults[key]["*"] as Hotel;
    singleHotel.bookmarked = bookmarks.includes(singleHotel.id);

    hotelList.push(singleHotel);
  }

  return hotelList;
}
```

Finally, update the UI to display each hotel's bookmark status. Show a transparent bookmark icon from Ionicons next to each hotel listing. If the hotel has been bookmarked, then show a filled in icon with the color red.

```html
<!-- src/app/tab1/tab1.page.html -->
<ion-list>
  <ion-item *ngFor="let hotel of hotelsDisplayed;">
    <ion-label>
      <h2>{{ hotel.name }}</h2>
      <p>{{ hotel.address }}</p>
      <p>{{ hotel.phone }}</p>
    </ion-label>
    <ion-icon *ngIf="!hotel.bookmarked" name="bookmark-outline" (click)="toggleBookmark(hotel)"></ion-icon>
    <ion-icon *ngIf="hotel.bookmarked" name="bookmark" color="danger" (click)="toggleBookmark(hotel)"></ion-icon>
  </ion-item>
</ion-list>
```

Now that bookmarked hotel data is being displayed, we can introduce more interactivity.

### Save Bookmarked Hotels

When the user taps on the bookmark icon next to a hotel entry, we need to update the Couchbase Lite database to reflect that state change. First, implement the toggle function to invert the hotel's bookmark status, then save the change using the database service: 

```typescript
// src/app/tab1/tab1.page.ts
async toggleBookmark(hotel) {
  hotel.bookmarked = !hotel.bookmarked;

  await this.databaseService.bookmarkHotel(hotel.id);
}
```

Next, implement a function to apply the bookmark change to the Couchbase Lite database. Add the hotel id to the array of hotels that are bookmarked:

```typescript
// src/app/services/database.service.ts
public async bookmarkHotel(hotelId: string) {
  let hotelArray = this.bookmarkDocument.getArray("hotels");
  hotelArray.addString(hotelId);
  this.bookmarkDocument.setArray("hotels", hotelArray);

  this.database.save(this.bookmarkDocument);
}
```

### Filter by Bookmarked Hotels

The last feature to add is the ability to toggle between all hotels and only bookmarked hotels. Begin by creating a variable to hold the state of the bookmark filter toggle and default it to false.

```typescript
// src/app/tab1/tab1.page.ts
export class Tab1Page {
  toggleBookmarkFilter: boolean = false;
  // snip - other variables
```

Next, implement a function that toggles between bookmark states. Invert the bookmark filter property and check if it's `true`. If true, filter the hotel list for only those that have the `bookmarked` property set to true. Update the UI based on the refreshed hotel list.

```typescript
// src/app/tab1/tab1.page.ts
async toggleShowBookmarks() {
  this.toggleBookmarkFilter = !this.toggleBookmarkFilter;

  if (this.toggleBookmarkFilter) {
    const filtered = this.hotels.filter(h => h.bookmarked == true);
    this.hotelsDisplayed = filtered;
  }
  else {
    this.hotelsDisplayed = this.hotels;
  }
}
```

Finally, update the UI so that when a bookmark filter icon is tapped, the `toggleShowBookmarks()` function is called. Display the same bookmark icon also displayed next to each hotel entry.

```html
<!-- src/app/tab1/tab1.page.html -->
<ion-content [fullscreen]="true">
  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-buttons collapse="true" (click)="toggleShowBookmarks()" slot="end">
        <ion-button slot="end">
          <ion-icon *ngIf="toggleBookmarkFilter" name="bookmarks" size="large" color="danger"></ion-icon>
          <ion-icon *ngIf="!toggleBookmarkFilter" name="bookmarks-outline" size="large" color="danger"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title size="large">Hotels</ion-title>
    </ion-toolbar>
  </ion-header>
  <!-- snip -->
</ion-content>
```

## Wrap Up

That's it! You've built an Angular app that allows users to search and bookmark hotels using data loaded from a Couchbase Lite database. Happy app building.
