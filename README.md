# @chriscdn/vuex-undo-redo

An undo/redo for Vuex.

## Motivation

There are many Vuex undo/redo solutions, but I couldn't find one that fit my needs.

The difficulty is knowing when to snapshot the Vuex state.  Most implementations do this by observing the store for action or mutation events.

Neither approach worked for me since some actions in my store make multiple mutations.  This lead to either:

- too many snapshots being created by actions when observing mutations; or
- not creating a snapshot after a mutation when only observing actions.

This module works by observing mutations and debouncing the method that creates the snapshot.  The snapshot is made after no mutation event is observed for a duration of one second.  This allows an action to make multiple consecutive mutations with only one snapshot being created.

This may or may not suit your requirements, but has worked well for me.

## Features

- can be dynamically added and removed from an existing store
- can be setup to snapshot and restore all or parts of your Vuex store
- convenient `canUndo` and `canRedo` reactive properties (to use in your UI)
- can be configured ￼￼to ignore specific mutation events

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

The `vuexUndoRedo` getter return value is what gets added to the undo stack.  This can be setup to return the entire Vuex state or just a section of it.

The `vuexUndoRedo` mutation receives the snapshot payload when an undo or redo is applied.  It's your responsibility to apply the payload appropriately to the store.

For example, the following could be used to snapshot and restore the entire Vuex state.

```js
// getter
vuexUndoRedo(state, getters) {
	return state
}

// mutation
vuexUndoRedo(state, payload) {
	Object.assign(state, payload)
}
```

A `VuexUndoRedo` instance can be instantiated as follows:

```js
import VuexUndoRedo from '@chriscdn/vuex-undo-redo'

const vuexUndoRedo = VuexUndoRedo(store[, options])
```

It's up to you to decide where you'd like to store the `vuexUndoRedo` instance.  For example, to make it globally available you could add it to the Vue prototype:

```js
Vue.prototype.$vuexUndoRedo = VuexUndoRedo(store, options)
````

You could also make it a local variable in a Vue component.  This might be useful if interaction with the API is limited to that component:

```js
created() {
	this.vuexUndoRedo = VuexUndoRedo(this.$store)
},

beforeDestroy() {
	this.vuexUndoRedo.destroy()
}

````

## API

### Constructor options

The default options are as follows and can be overridden.

```js
const options = {
	stackSize: 10, // how many undo snapshots to store
	debounceTime: 1000, // the denounce time before creating a snapshot
	ignoreMutations: [], // an array of mutations to ignore
	mutation: 'vuexUndoRedo', // the name of the mutation (see above)
	getter: 'vuexUndoRedo' // the name of the getter (see above)
}
```

### Instance properties

The `canUndo` and `canRedo` reactive properties return `true` or `false`.  These can, for example, be used in the user interface to enable or disable buttons.

```html
<button :disabled="!vuexUndoRedo.canUndo" @click="vuexUndoRedo.undo">Undo</button>
<button :disabled="!vuexUndoRedo.canRedo" @click="vuexUndoRedo.redo">Redo</button>

```

### Instance methods

#### Undo or Redo

```js
// Pops the undo stack and passes the value to the vuexUndoRedo mutation
vuexUndoRedo.undo()

// Pops the redo stack and passes the value to the vuexUndoRedo mutation
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