# @chriscdn/vuex-undo-redo

An undo/redo for Vuex.

## Motivation

There are many Vuex undo/redo solutions available, but I couldn't find one that fit my needs.

The difficulty is knowing when to create a snapshot of the Vuex state.  Most implementations do this by observing the store for action or mutation events.

Neither of these observers worked for me since many actions in my store make multiple mutations.  This lead to either:

- too many snapshots being created when observing mutations; or
- missing mutations when observing actions.

This module works around this by observing mutations and debouncing the method to create the snapshot.  The snapshot is only made after a one second interval between calls to the snapshot function (this is configurable).  This allows an action to make multiple commits and only have one snapshot created.

## Features

- can be dynamically added and removed from an existing store
- can be setup to snapshot (and restore) any part of your Vuex store
- convenient `canUndo` and `canRedo` reactive properties (to use in your UI)

## Installing

Using npm:

```
$ npm install @chriscdn/vue-undo-redo
```

Using yarn:

```
$ yarn add @chriscdn/vue-undo-redo
```

## Usage 

...

## Credits

...

## License

MIT