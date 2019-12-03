"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _vue = _interopRequireDefault(require("vue"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var debounce = require('lodash.debounce');

var clonedeep = require('lodash.clonedeep');

var defaultOptions = {
  stackSize: 10,
  debounceTime: 1000,
  ignoreMutations: [],
  mutator: 'vuexUndoRedo',
  getter: 'vuexUndoRedo'
};

function _default(store) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  options = _objectSpread({}, defaultOptions, {}, options);
  return new _vue["default"]({
    data: function data() {
      return {
        undoStack: [],
        redoStack: [] // previousState: null

      };
    },
    computed: {
      // The entire point of using a Vue instance is such that 
      // these properties are reactive and can be used in the UI.
      canUndo: function canUndo() {
        return this.undoStack.length > 0;
      },
      canRedo: function canRedo() {
        return this.redoStack.length > 0;
      }
    },
    methods: {
      currentStateCopy: function currentStateCopy() {
        // let state = store.getters.vuexUndoRedo // [options.getter]
        var state = store.getters[options.getter]; // return JSON.stringify(state)
        // performance?

        return clonedeep(state);
      },
      setStateToStore: function setStateToStore(state) {
        // let newState = JSON.parse(state)
        var newState = state;
        store.commit(options.mutator, newState);
        this.previousState = state;
      },
      undo: function undo() {
        if (this.canUndo) {
          this.redoStack.push(this.currentStateCopy());
          this.setStateToStore(this.undoStack.pop());
        }
      },
      redo: function redo() {
        if (this.canRedo) {
          this.undoStack.push(this.currentStateCopy());
          this.setStateToStore(this.redoStack.pop());
        }
      },
      reset: function reset() {
        this.previousState = this.currentStateCopy();
        this.redoStack = [];
        this.undoStack = [];
      },
      snapshotLeading: debounce(function () {
        if (this.previousState) {
          var previousState = this.previousState;
          var lastPushedState = this.undoStack.slice(-1);

          if (JSON.stringify(previousState) == JSON.stringify(lastPushedState)) {// no need to push, nothing changed
          } else {
            this.undoStack.push(this.previousState); // limit the stack size

            this.undoStack = this.undoStack.slice(-options.stackSize);
          }
        } else {
          // error case?
          this.reset();
        }
      }, options.debounceTime, {
        leading: true,
        trailing: false
      }),
      snapshotTrailing: debounce(function () {
        this.previousState = this.currentStateCopy();
      }, options.debounceTime, {
        leading: false,
        trailing: true
      }),
      snapshot: function snapshot() {
        // Why?  The onMutation callback is called after a mutation is applied.
        // This not helpful since we'd like to be able to undo the current mutation.  
        // So we have two debounced methods.  One pushes the current state onto 
        // the undoStack, while the other captures the current state after everything
        // is applied.
        this.snapshotLeading();
        this.snapshotTrailing();
      },
      // cancel() {
      // 	this.snapshotLeading.cancel()
      // 	this.snapshotTrailing.cancel()
      // },
      onMutation: function onMutation(mutation, _state) {
        var ignore = options.ignoreMutations.concat(options.mutator);

        if (ignore.includes(mutation.type)) {// do nothing
        } else {
          this.redoStack = [];
          this.snapshot();
        }
      },
      destroy: function destroy() {
        this.unsubscribeMutation();
        this.$destroy();
      }
    },
    created: function created() {
      this.unsubscribeMutation = store.subscribe(this.onMutation);
    }
  });
}