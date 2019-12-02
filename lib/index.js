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

var defaultOptions = {
  stackSize: 10,
  debounceTime: 1000,
  ignoreMutations: []
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
      // The entire point of using a Vue instance is such that these properties
      // are reactive and can be used in the UI.
      canUndo: function canUndo() {
        return this.undoStack.length > 0;
      },
      canRedo: function canRedo() {
        return this.redoStack.length > 0;
      }
    },
    methods: {
      store_json: function store_json() {
        // this is the NOW current state
        if (store.state.books) {
          return JSON.stringify(store.state.books);
        } else {
          return null;
        }
      },
      setNewState: function setNewState(json_state) {
        var newState = JSON.parse(json_state);
        store.commit('setBookState', newState);
        this.previousState = json_state;
      },
      undo: function undo() {
        if (this.canUndo) {
          this.redoStack.push(this.store_json());
          this.setNewState(this.undoStack.pop());
        }
      },
      redo: function redo() {
        if (this.canRedo) {
          this.undoStack.push(this.store_json());
          this.setNewState(this.redoStack.pop());
        }
      },
      reset: function reset() {
        this.previousState = this.store_json();
        this.redoStack = [];
        this.undoStack = [];
      },
      snapshotLeading: debounce(function () {
        if (this.previousState) {
          var previousState = this.previousState;
          var lastPushedState = this.undoStack.slice(-1);

          if (previousState == lastPushedState) {// no need to push, nothing changed
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
        this.previousState = this.store_json();
      }, options.debounceTime, {
        leading: false,
        trailing: true
      }),
      snapshot: function snapshot() {
        // Why?  The onMutation callback is called after a mutation is applied.  This is pointless since we'd like to be able to
        // undo the current mutation.  So we have two debounced methods.  One pushes the "current" state into the undoStack, while
        // the other captures the "current" state after everything is applied.
        this.snapshotLeading();
        this.snapshotTrailing();
      },
      onMutation: function onMutation(mutation, _state) {
        if (options.ignoreMutations.includes(mutation.type)) {// do nothing
        } else {
          this.redoStack = [];
          this.snapshot();
        }
      },
      unregister: function unregister() {
        this.unsubscribeMutation();
      }
    },
    created: function created() {
      this.unsubscribeMutation = store.subscribe(this.onMutation);
    }
  });
}