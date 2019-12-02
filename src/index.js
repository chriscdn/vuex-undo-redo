import Vue from 'vue'

const debounce = require('lodash.debounce')
const clonedeep = require('lodash.clonedeep')

const defaultOptions = {
	stackSize: 10,
	debounceTime: 1000,
	ignoreMutations: [],
	mutator: 'undoRedoState',
	getter: 'undoRedoState'
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
				redoStack: []
				// previousState: null
			}
		},
		computed: {
			// The entire point of using a Vue instance is such that 
			// these properties are reactive and can be used in the UI.
			canUndo() {
				return this.undoStack.length > 0
			},
			canRedo() {
				return this.redoStack.length > 0
			}
		},
		methods: {
			currentStateCopy() {
				let state = store.getters.undoRedoState // [options.getter]

				// return JSON.stringify(state)
				// performance?
				return clonedeep(state)
			},

			setStateToStore(state) {
				// let newState = JSON.parse(state)
				let newState = state
				store.commit(options.mutator, newState)
				this.previousState = state
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
				this.snapshotLeading()
				this.snapshotTrailing()
			},

			onMutation(mutation, _state) {
				const ignore = options.ignoreMutations.concat(options.mutator)

				if (ignore.includes(mutation.type)) {
					// do nothing
				} else {
					this.redoStack = []
					this.snapshot()
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