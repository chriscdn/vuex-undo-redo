import Vue from 'vue'

const debounce = require('lodash.debounce')

const defaultOptions = {
	stackSize: 10,
	debounceTime: 1000,
	ignoreMutations: []
}

export default function(store, options = {}) {

	options = { ...defaultOptions, ...options }

	return new Vue({
		data() {
			return {
				undoStack: [],
				redoStack: [],
				// previousState: null
			}
		},
		computed: {
			// The entire point of using a Vue instance is such that these properties
			// are reactive and can be used in the UI.
			canUndo() {
				return this.undoStack.length > 0
			},
			canRedo() {
				return this.redoStack.length > 0
			}
		},
		methods: {
			store_json() {
				// this is the NOW current state
				if (store.state.books) {
					return JSON.stringify(store.state.books)
				} else {
					return null
				}
			},

			setNewState(json_state) {
				let newState = JSON.parse(json_state)

				store.commit('setBookState', newState)
				this.previousState = json_state
			},

			undo() {
				if (this.canUndo) {
					this.redoStack.push(this.store_json())
					this.setNewState(this.undoStack.pop())
				}
			},

			redo() {
				if (this.canRedo) {
					this.undoStack.push(this.store_json())
					this.setNewState(this.redoStack.pop())
				}
			},

			reset() {
				this.previousState = this.store_json()
				this.redoStack = []
				this.undoStack = []
			},

			snapshotLeading: debounce(function() {

				if (this.previousState) {

					let previousState = this.previousState
					let lastPushedState = this.undoStack.slice(-1)

					if (previousState == lastPushedState) {
						// no need to push, nothing changed
					} else {
						this.undoStack.push(this.previousState)

						// limit the stack size
						this.undoStack = this.undoStack.slice(-options.stackSize)
					}
				} else {
					// error case?
					this.reset()
				}
			}, options.debounceTime, {
				leading: true,
				trailing: false
			}),

			snapshotTrailing: debounce(function() {
				this.previousState = this.store_json()
			}, options.debounceTime, {
				leading: false,
				trailing: true
			}),

			snapshot() {
				// Why?  The onMutation callback is called after a mutation is applied.  This is pointless since we'd like to be able to
				// undo the current mutation.  So we have two debounced methods.  One pushes the "current" state into the undoStack, while
				// the other captures the "current" state after everything is applied.
				this.snapshotLeading()
				this.snapshotTrailing()
			},

			onMutation(mutation, _state) {
				if (options.ignoreMutations.includes(mutation.type)) {
					// do nothing
				} else {
					this.redoStack = []
					this.snapshot()
				}
			},
			unregister() {
				this.unsubscribeMutation()
			}
		},
		created() {
			this.unsubscribeMutation = store.subscribe(this.onMutation)
		}
	})
}