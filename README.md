# @chriscdn/vuex-undo-redo

An undo/redo for Vuex.

## Motivation

There are many Vuex undo/redo solutions, but I couldn't find one that fit my needs.

The difficulty is knowing when to create a snapshot of the Vuex state.  Most implementations do this by observing the store for action or mutation events.

Neither of these observers worked for me since many actions in my store make multiple mutations.  This leads to either:

- too many snapshots being created when only observing mutations; or
- missing mutation events when only observing actions.

I also required only sections of my Vuex store to be snapshotted and restored.

This module works by observing mutations and debouncing the snapshot method.  The snapshot is made after no mutation event occur for one second (this is configurable).  This allows an action to make multiple consecutive commits and only have one snapshot created.

This may or may not suit your requirements, but has worked well for me.

## Features

- can be dynamically added and removed from an existing store
- can be setup to snapshot and restore any part of your Vuex store
- convenient `canUndo` and `canRedo` reactive properties (to use in your UI)
- can be configured to ignore specific mutation events

## Installing

Using npm:

```bash
$ npm install @chriscdn/vuex-undo-redo
```

Using yarn:

```bash
$ yarn add @chriscdn/vuex-undo-redo
```

## Setup

A getter and mutation named `vuexUndoRedo` must be added to your Vuex store (the names can be configured).

The getter value is used when making a snapshot of the current state.  This can be setup to return the entire state of the store or just a part of it.

The mutation receives the getter snapshot when a undo or redo is applied.  It's your responsibility to unpack the payload and apply it appropriately to the store.

For example, the following could be used to snapshot and restore the entire Vuex state.

```js
// getter
vuexUndoRedo(state) {
	return state
}

// mutation
vuexUndoRedo(state, payload) {
	Object.assign(state, payload)
}
```

An instance can be made as follows:

```js
import VuexUndoRedo from '@chriscdn/vuex-undo-redo'

const vuexUndoRedo = VuexUndoRedo(store[, options])
```

It's up to you to decide where to store the `vuexUndoRedo` instance.  For example, to make it globally available you could add it to the Vue prototype:

```js
Vue.prototype.$vuexUndoRedo = VuexUndoRedo(store, options)
````

You could also make it a local variable in a Vue component if interaction with the API is limited to that component.

```js
created() {
	this.vuexUndoRedo = VuexUndoRedo(this.$store)
},

beforeDestroy() {
	this.vuexUndoRedo.destroy()
}

````

## API

##### Constructor options

The default options are as follows and can be overridden.

```js
const options = {
	stackSize: 10, // how many undo snapshots to store
	debounceTime: 1000, // the time in milliseconds to wait before creating a snapshot
	ignoreMutations: [], // an array of mutations to ignore
	mutator: 'vuexUndoRedo', // the name of the mutator (see above)
	getter: 'vuexUndoRedo' // the name of the getter (see above)
}
```

### Instance properties

The `canUndo` and `canRedo` are reactive properites that return `true` or `false`.  For example, these can be used in the user interface to enable or disable a button.

```html
<button :disabled="!vuexUndoRedo.canUndo" @click="vuexUndoRedo.undo">Undo</button>
<button :disabled="!vuexUndoRedo.canRedo" @click="vuexUndoRedo.redo">Redo</button>

```

### Instance methods

#### Undo or Redo

```js
// Pops the undo stack and passes the value to the vuexUndoRedo mutator
vuexUndoRedo.undo()

// Pops the redo stack and passes the value to the vuexUndoRedo mutator
vuexUndoRedo.redo()
```

#### Reset the undo/redo stack

```js
vuexUndoRedo.reset()
```

#### Destroy the instance

```js
// stop observing the store and destroy the instance
vuexUndoRedo.destroy()
````

## Credits

...

## License

MIT