import Vue from 'vue'

const debounce = require('lodash.debounce')
const clonedeep = require('lodash.clonedeep')


const defaultOptions = {
	stackSize: 10,
	debounceTime: 1000,
	ignoreMutations: [],
	mutator: 'vuexUndoRedo',
	getter: 'vuexUndoRedo'
}

export default function(store, options = {}) {

	options = {
		...defaultOptions,
		...options
	}

	return new Vue({
		data() {
			return {
				undoStack: [],
				redoStack: [],
				enabled: true
				// previousState: null
			}
		},
		computed: {
			// The entire reason for using a Vue instance is to make these properties reactive.
			canUndo() {
				return this.undoStack.length > 0
			},
			canRedo() {
				return this.redoStack.length > 0
			}
		},
		methods: {
			currentStateCopy() {
				// let state = store.getters.vuexUndoRedo // [options.getter]

				let state = store.getters[options.getter]

				// return JSON.stringify(state)
				// performance?
				return clonedeep(state)
			},

			setStateToStore(state) {
				// let newState = JSON.parse(state)
				let newState = state
				store.commit(options.mutator, newState)
				this.previousState = clonedeep(state)
			},

			undo() {
				if (this.canUndo) {
					this.redoStack.push(this.currentStateCopy())
					this.setStateToStore(this.undoStack.pop())
				}
			},

			redo() {
				if (this.canRedo) {
					this.undoStack.push(this.currentStateCopy())
					this.setStateToStore(this.redoStack.pop())
				}
			},
			resume() {
				this.enabled = true
				this.snapshot()
			},

			suspend() {
				this.enabled = false
			},

			reset() {
				this.previousState = this.currentStateCopy()
				this.redoStack = []
				this.undoStack = []
			},

			snapshotLeading: debounce(function() {
				if (this.previousState) {
					let previousState = this.previousState
					let lastPushedState = this.undoStack.slice(-1)

					if (JSON.stringify(previousState) == JSON.stringify(lastPushedState)) {
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
				this.previousState = this.currentStateCopy()
			}, options.debounceTime, {
				leading: false,
				trailing: true
			}),

			snapshot() {
				// Why?  The onMutation callback is called after a mutation is applied.
				// This not helpful since we'd like to be able to undo the current mutation.  
				// So we have two debounced methods.  One pushes the current state onto 
				// the undoStack, while the other captures the current state after everything
				// is applied.
				if (this.enabled) {
					this.snapshotLeading()
					this.snapshotTrailing()
				}
			},

			// cancel() {
			// 	this.snapshotLeading.cancel()
			// 	this.snapshotTrailing.cancel()
			// },

			onMutation(mutation, _state) {

				if (mutation.type == options.mutator) {
					// do nothing
				} else if (options.ignoreMutations.includes(mutation.type)) {
					this.redoStack = [] // reset the redo stack
				} else {
					this.snapshot()
					this.redoStack = [] // reset the redo stack
				}

			},
			destroy() {
				this.unsubscribeMutation()
				this.$destroy()
			}
		},
		created() {
			this.unsubscribeMutation = store.subscribe(this.onMutation)
		}
	})
}