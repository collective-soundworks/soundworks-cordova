'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _client = require('soundworks/client');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* based on cordova-plugin-ibeacon: https://github.com/petermetz/cordova-plugin-ibeacon.git */
var SERVICE_ID = 'service:beacon';

var CORDOVA_PLUGIN_NAME = 'com.unarin.cordova.beacon';
var CORDOVA_PLUGIN_ASSERTED_VERSION = '3.3.0';
var CORDOVA_PLUGIN_REPOSITORY = 'https://github.com/petermetz/cordova-plugin-ibeacon.git';

var Beacon = function (_Service) {
  (0, _inherits3.default)(Beacon, _Service);

  /** _<span class="warning">__WARNING__</span> This class should never be instanciated manually_ */
  function Beacon() {
    (0, _classCallCheck3.default)(this, Beacon);

    // false: does not need netwok connection

    var _this = (0, _possibleConstructorReturn3.default)(this, (Beacon.__proto__ || (0, _getPrototypeOf2.default)(Beacon)).call(this, SERVICE_ID, false));

    var defaults = {
      uuid: '74278BDA-B644-4520-8F0C-720EAF059935'
    };

    _this.configure(defaults);

    // local attributes
    _this._beaconData = {};
    _this._callbacks = new _set2.default();
    _this._cordovaPluginInstalled = false;
    _this._txPower = -55;
    _this._hasBeenCalibrated = false;

    // bind local methods
    _this._startAdvertising = _this._startAdvertising.bind(_this);
    _this._stopAdvertising = _this._stopAdvertising.bind(_this);
    _this._startRanging = _this._startRanging.bind(_this);
    _this._stopRanging = _this._stopRanging.bind(_this);
    _this._didRangeBeaconsInRegion = _this._didRangeBeaconsInRegion.bind(_this);
    _this._checkPlugin = _this._checkPlugin.bind(_this);
    _this.restartAdvertising = _this.restartAdvertising.bind(_this);
    _this.restartRanging = _this.restartRanging.bind(_this);

    return _this;
  }

  /** @private */


  (0, _createClass3.default)(Beacon, [{
    key: 'init',
    value: function init() {

      /**
       * - uuid represent the beacon region. a given ranging callback can obly monitor
       * beacons with the same uuid, hence uuid in the soundwork beacon service is hardcoded.
       * - identifier came with the cordova-plugin-ibeacon API, no real cues why it's there.
       * - major / minor: each encoded on 16 bits, these values are to be used to defined a
       * unique soundwork client.
       */
      this._beaconData = {
        uuid: this.options.uuid,
        identifier: 'advertisedBeacon',
        major: Math.floor(Math.random() * 65500),
        minor: Math.floor(Math.random() * 65500)
      };

      this._checkPlugin();
      this._startAdvertising();
      this._startRanging();
    }

    /** @private */

  }, {
    key: 'start',
    value: function start() {
      (0, _get3.default)(Beacon.prototype.__proto__ || (0, _getPrototypeOf2.default)(Beacon.prototype), 'start', this).call(this);

      if (!this.hasStarted) this.init();

      this.ready();
    }

    /** @private
    /*  automatically called with this.ready()
    */

  }, {
    key: 'stop',
    value: function stop() {
      (0, _get3.default)(Beacon.prototype.__proto__ || (0, _getPrototypeOf2.default)(Beacon.prototype), 'stop', this).call(this);
    }

    /**
     * Register a function that will be invokedwhen neighboring ibeacon list is updated
     * (i.e. every nth millisec. once a single beacon is registered)
     * @param {Function} callback
     */

  }, {
    key: 'addListener',
    value: function addListener(callback) {
      this._callbacks.add(callback);
    }

    /**
    * remove registered callback from stack (see "addCallback")
    */

  }, {
    key: 'removeListener',
    value: function removeListener(callback) {
      if (this._callbacks.has(callback)) {
        this._callbacks.delete(callback);
      }
    }

    /**
    * remove registered callback from stack (see "addCallback")
    */

  }, {
    key: 'rssiToDist',
    value: function rssiToDist(rssi) {
      if (!this._hasBeenCalibrated) {
        console.warn('rssiToDist called prior to txPower definition (calibration), using default value:', this._txPower, 'dB');
        this._hasBeenCalibrated = true;
      }
      var dist = this._calculateAccuracy(this.txPower, rssi);
      return dist;
    }

    /** @private */

  }, {
    key: '_startAdvertising',
    value: function _startAdvertising() {

      if (this._cordovaPluginInstalled) {

        // define beacon parameters
        var uuid = this._beaconData.uuid;
        var identifier = this._beaconData.identifier;
        var minor = this._beaconData.minor;
        var major = this._beaconData.major;
        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major, minor);

        // verify the platform supports transmitting as a beacon
        cordova.plugins.locationManager.isAdvertisingAvailable().then(function (isSupported) {

          if (isSupported) {
            // start advertising
            cordova.plugins.locationManager.startAdvertising(beaconRegion).fail(console.error).done();
          } else {
            console.log("Advertising not supported");
          }
        }).fail(function (e) {
          console.error(e);
        }).done();
      }
    }

    /** @private */

  }, {
    key: '_stopAdvertising',
    value: function _stopAdvertising() {
      if (this._cordovaPluginInstalled) {
        cordova.plugins.locationManager.stopAdvertising().fail(function (e) {
          console.error(e);
        }).done();
      }
    }

    /** @private */

  }, {
    key: '_startRanging',
    value: function _startRanging() {

      if (this._cordovaPluginInstalled) {

        var delegate = new cordova.plugins.locationManager.Delegate();
        delegate.didRangeBeaconsInRegion = this._didRangeBeaconsInRegion;
        cordova.plugins.locationManager.setDelegate(delegate);

        var uuid = this._beaconData.uuid;
        var identifier = this._beaconData.identifier;
        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid);

        // required in iOS 8+
        cordova.plugins.locationManager.requestWhenInUseAuthorization();
        // or cordova.plugins.locationManager.requestAlwaysAuthorization()

        cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion).fail(function (e) {
          console.error(e);
        }).done();
      }
    }

    /** @private */

  }, {
    key: '_didRangeBeaconsInRegion',
    value: function _didRangeBeaconsInRegion(pluginResult) {
      // call user defined callbacks
      this._callbacks.forEach(function (callback) {
        callback(pluginResult);
      });
    }

    /** @private */

  }, {
    key: '_stopRanging',
    value: function _stopRanging() {
      if (this._cordovaPluginInstalled) {
        var uuid = this._beaconData.uuid;
        var identifier = this._beaconData.identifier;
        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid);

        cordova.plugins.locationManager.stopRangingBeaconsInRegion(beaconRegion).fail(function (e) {
          console.error(e);
        }).done();
      }
    }

    /** @private */

  }, {
    key: '_checkPlugin',
    value: function _checkPlugin() {

      var display_install_instruction = false;

      var plugins = cordova.require("cordova/plugin_list").metadata;
      if (typeof plugins[CORDOVA_PLUGIN_NAME] === "undefined") {
        console.warn('Cordova plugin <cordova-plugin-ibeacon> not installed -> beacon service disabled');
        display_install_instruction = true;
      } else {
        if (plugins[CORDOVA_PLUGIN_NAME] != CORDOVA_PLUGIN_ASSERTED_VERSION) {
          console.warn('Cordova plugin <cordova-plugin-ibeacon> version mismatch: installed: ' + plugins[CORDOVA_PLUGIN_NAME] + ' required: ' + CORDOVA_PLUGIN_ASSERTED_VERSION + ' (version not tested, use at your own risk)');
          display_install_instruction = true;
        }
        this._cordovaPluginInstalled = true;
      }
      if (display_install_instruction) {
        console.log('-> to install ' + CORDOVA_PLUGIN_NAME + ' v' + CORDOVA_PLUGIN_ASSERTED_VERSION + ', use:', 'cordova plugin add ' + CORDOVA_PLUGIN_REPOSITORY + '#' + CORDOVA_PLUGIN_ASSERTED_VERSION);
      }
    }

    /** @private
    * convert rssi to distance, naming (_calculateAccuracy rather than calculateDistance)
    * is intentional: USE WITH CAUTION, as explained @
    * http://stackoverflow.com/questions/20416218/understanding-ibeacon-distancing
    */

  }, {
    key: '_calculateAccuracy',
    value: function _calculateAccuracy(txPower, rssi) {
      if (rssi == 0) {
        return 0.0;
      }
      var ratio = rssi * 1.0 / txPower;
      if (ratio < 1.0) {
        return Math.pow(ratio, 10);
      } else {
        return 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
      }
    }

    /**
    * Get advertising iBeacon region UUID
    */

  }, {
    key: 'restartAdvertising',


    /**
    * Restart advertising to take into acount uuid, major or minor change.
    */
    value: function restartAdvertising() {
      this._stopAdvertising();
      this._startAdvertising();
    }

    /**
    * Restart ranging to take into acount uuid change.
    */

  }, {
    key: 'restartRanging',
    value: function restartRanging() {
      this._stopRanging();
      this._startRanging();
    }
  }, {
    key: 'uuid',
    get: function get() {
      return this._beaconData.uuid;
    }
    /**
    * Get advertising iBeacon major ID
    */
    ,


    /**
    * Set advertising iBeacon UUID
    * @param {String} val - new UUID
    */
    set: function set(val) {
      // USE AT YOUR OWN RISKS
      this._beaconData.uuid = val;
      this.options.uuid = val;
      this._stopRanging();
      this._startRanging();
    }

    /**
    * Set advertising iBeacon major ID
    * @param {Number} val - new major ID
    */

  }, {
    key: 'major',
    get: function get() {
      return this._beaconData.major;
    }
    /**
    * Get advertising iBeacon minor ID
    */
    ,
    set: function set(val) {
      if (val <= 65535 && val >= 0) {
        this._beaconData.major = val;
      } else {
        console.warn('WARNING: attempt to define invalid major value: ', val, ' (must be in range [0,65535]');
      }
    }

    /**
    * Set advertising iBeacon minor ID
    * @param {Number} val - new minor ID
    */

  }, {
    key: 'minor',
    get: function get() {
      return this._beaconData.minor;
    }
    /**
    * Get reference signal strength, used for distance estimation.
    * txPower is the rssi (in dB) as mesured by another beacon
    * located at 1 meter away from this beacon.
    */
    ,
    set: function set(val) {
      if (val <= 65535 && val >= 0) {
        this._beaconData.minor = val;
      } else {
        console.warn('WARNING: attempt to define invalid minor value: ', val, ' (must be in range [0,65535]');
      }
    }

    /**
    * Get reference signal strength, used for distance estimation.
    * txPower is the rssi (in dB) as mesured by another beacon
    * located at 1 meter away from this beacon.
    * @param {Number} val - new signal strength reference
    */

  }, {
    key: 'txPower',
    get: function get() {
      return this._txPower;
    },
    set: function set(val) {
      if (val <= 0 && val >= -200) {
        this._txPower = val;
        this._hasBeenCalibrated = true;
      } else {
        console.warn('WARNING: a reference txPower value of: ', val, ' dB is unlikely (set has been rejected)');
      }
    }
  }]);
  return Beacon;
}(_client.Service);

_client.serviceManager.register(SERVICE_ID, Beacon);

exports.default = Beacon;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkJlYWNvbi5qcyJdLCJuYW1lcyI6WyJTRVJWSUNFX0lEIiwiQ09SRE9WQV9QTFVHSU5fTkFNRSIsIkNPUkRPVkFfUExVR0lOX0FTU0VSVEVEX1ZFUlNJT04iLCJDT1JET1ZBX1BMVUdJTl9SRVBPU0lUT1JZIiwiQmVhY29uIiwiZGVmYXVsdHMiLCJ1dWlkIiwiY29uZmlndXJlIiwiX2JlYWNvbkRhdGEiLCJfY2FsbGJhY2tzIiwiX2NvcmRvdmFQbHVnaW5JbnN0YWxsZWQiLCJfdHhQb3dlciIsIl9oYXNCZWVuQ2FsaWJyYXRlZCIsIl9zdGFydEFkdmVydGlzaW5nIiwiYmluZCIsIl9zdG9wQWR2ZXJ0aXNpbmciLCJfc3RhcnRSYW5naW5nIiwiX3N0b3BSYW5naW5nIiwiX2RpZFJhbmdlQmVhY29uc0luUmVnaW9uIiwiX2NoZWNrUGx1Z2luIiwicmVzdGFydEFkdmVydGlzaW5nIiwicmVzdGFydFJhbmdpbmciLCJvcHRpb25zIiwiaWRlbnRpZmllciIsIm1ham9yIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwibWlub3IiLCJoYXNTdGFydGVkIiwiaW5pdCIsInJlYWR5IiwiY2FsbGJhY2siLCJhZGQiLCJoYXMiLCJkZWxldGUiLCJyc3NpIiwiY29uc29sZSIsIndhcm4iLCJkaXN0IiwiX2NhbGN1bGF0ZUFjY3VyYWN5IiwidHhQb3dlciIsImJlYWNvblJlZ2lvbiIsImNvcmRvdmEiLCJwbHVnaW5zIiwibG9jYXRpb25NYW5hZ2VyIiwiQmVhY29uUmVnaW9uIiwiaXNBZHZlcnRpc2luZ0F2YWlsYWJsZSIsInRoZW4iLCJpc1N1cHBvcnRlZCIsInN0YXJ0QWR2ZXJ0aXNpbmciLCJmYWlsIiwiZXJyb3IiLCJkb25lIiwibG9nIiwiZSIsInN0b3BBZHZlcnRpc2luZyIsImRlbGVnYXRlIiwiRGVsZWdhdGUiLCJkaWRSYW5nZUJlYWNvbnNJblJlZ2lvbiIsInNldERlbGVnYXRlIiwicmVxdWVzdFdoZW5JblVzZUF1dGhvcml6YXRpb24iLCJzdGFydFJhbmdpbmdCZWFjb25zSW5SZWdpb24iLCJwbHVnaW5SZXN1bHQiLCJmb3JFYWNoIiwic3RvcFJhbmdpbmdCZWFjb25zSW5SZWdpb24iLCJkaXNwbGF5X2luc3RhbGxfaW5zdHJ1Y3Rpb24iLCJyZXF1aXJlIiwibWV0YWRhdGEiLCJyYXRpbyIsInBvdyIsInZhbCIsInJlZ2lzdGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFLQTtBQUNBLElBQU1BLGFBQWEsZ0JBQW5COztBQUVBLElBQU1DLHNCQUFzQiwyQkFBNUI7QUFDQSxJQUFNQyxrQ0FBa0MsT0FBeEM7QUFDQSxJQUFNQyw0QkFBNEIseURBQWxDOztJQUVNQyxNOzs7QUFDSjtBQUNBLG9CQUFjO0FBQUE7O0FBQ2M7O0FBRGQsc0lBQ05KLFVBRE0sRUFDTSxLQUROOztBQUdaLFFBQU1LLFdBQVc7QUFDZkMsWUFBTTtBQURTLEtBQWpCOztBQUlBLFVBQUtDLFNBQUwsQ0FBZUYsUUFBZjs7QUFFQTtBQUNBLFVBQUtHLFdBQUwsR0FBbUIsRUFBbkI7QUFDQSxVQUFLQyxVQUFMLEdBQWtCLG1CQUFsQjtBQUNBLFVBQUtDLHVCQUFMLEdBQStCLEtBQS9CO0FBQ0EsVUFBS0MsUUFBTCxHQUFnQixDQUFDLEVBQWpCO0FBQ0EsVUFBS0Msa0JBQUwsR0FBMEIsS0FBMUI7O0FBRUE7QUFDQSxVQUFLQyxpQkFBTCxHQUF5QixNQUFLQSxpQkFBTCxDQUF1QkMsSUFBdkIsT0FBekI7QUFDQSxVQUFLQyxnQkFBTCxHQUF3QixNQUFLQSxnQkFBTCxDQUFzQkQsSUFBdEIsT0FBeEI7QUFDQSxVQUFLRSxhQUFMLEdBQXFCLE1BQUtBLGFBQUwsQ0FBbUJGLElBQW5CLE9BQXJCO0FBQ0EsVUFBS0csWUFBTCxHQUFvQixNQUFLQSxZQUFMLENBQWtCSCxJQUFsQixPQUFwQjtBQUNBLFVBQUtJLHdCQUFMLEdBQWdDLE1BQUtBLHdCQUFMLENBQThCSixJQUE5QixPQUFoQztBQUNBLFVBQUtLLFlBQUwsR0FBb0IsTUFBS0EsWUFB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S0FBeEI7QUFDRDtBQUNEOzs7Ozs7c0JBcUNXMkMsRyxFQUFLO0FBQ2QsVUFBTUEsT0FBTyxLQUFSLElBQW1CQSxPQUFPLENBQS9CLEVBQW1DO0FBQ2pDLGFBQUsvRCxXQUFMLENBQWlCb0IsS0FBakIsR0FBeUIyQyxHQUF6QjtBQUNELE9BRkQsTUFHSztBQUNIbEMsZ0JBQVFDLElBQVIsQ0FBYSxrREFBYixFQUFpRWlDLEdBQWpFLEVBQXNFLDhCQUF0RTtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7Ozs7Ozt3QkF6Q2U7QUFDYixhQUFPLEtBQUs1RCxRQUFaO0FBQ0QsSztzQkE2Q1k0RCxHLEVBQUs7QUFDaEIsVUFBTUEsT0FBTyxDQUFSLElBQWVBLE9BQU8sQ0FBQyxHQUE1QixFQUFrQztBQUNoQyxhQUFLNUQsUUFBTCxHQUFnQjRELEdBQWhCO0FBQ0EsYUFBSzNELGtCQUFMLEdBQTBCLElBQTFCO0FBQ0QsT0FIRCxNQUlLO0FBQ0h5QixnQkFBUUMsSUFBUixDQUFhLHlDQUFiLEVBQXdEaUMsR0FBeEQsRUFBNkQseUNBQTdEO0FBQ0Q7QUFDRjs7Ozs7QUFvQkgsdUJBQWVDLFFBQWYsQ0FBd0J4RSxVQUF4QixFQUFvQ0ksTUFBcEM7O2tCQUVlQSxNIiwiZmlsZSI6IkJlYWNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFNlcnZpY2UsXG4gIHNlcnZpY2VNYW5hZ2VyXG59IGZyb20gJ3NvdW5kd29ya3MvY2xpZW50JztcblxuLyogYmFzZWQgb24gY29yZG92YS1wbHVnaW4taWJlYWNvbjogaHR0cHM6Ly9naXRodWIuY29tL3BldGVybWV0ei9jb3Jkb3ZhLXBsdWdpbi1pYmVhY29uLmdpdCAqL1xuY29uc3QgU0VSVklDRV9JRCA9ICdzZXJ2aWNlOmJlYWNvbic7XG5cbmNvbnN0IENPUkRPVkFfUExVR0lOX05BTUUgPSAnY29tLnVuYXJpbi5jb3Jkb3ZhLmJlYWNvbic7XG5jb25zdCBDT1JET1ZBX1BMVUdJTl9BU1NFUlRFRF9WRVJTSU9OID0gJzMuMy4wJztcbmNvbnN0IENPUkRPVkFfUExVR0lOX1JFUE9TSVRPUlkgPSAnaHR0cHM6Ly9naXRodWIuY29tL3BldGVybWV0ei9jb3Jkb3ZhLXBsdWdpbi1pYmVhY29uLmdpdCc7XG5cbmNsYXNzIEJlYWNvbiBleHRlbmRzIFNlcnZpY2Uge1xuICAvKiogXzxzcGFuIGNsYXNzPVwid2FybmluZ1wiPl9fV0FSTklOR19fPC9zcGFuPiBUaGlzIGNsYXNzIHNob3VsZCBuZXZlciBiZSBpbnN0YW5jaWF0ZWQgbWFudWFsbHlfICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFNFUlZJQ0VfSUQsIGZhbHNlKTsgLy8gZmFsc2U6IGRvZXMgbm90IG5lZWQgbmV0d29rIGNvbm5lY3Rpb25cblxuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgdXVpZDogJzc0Mjc4QkRBLUI2NDQtNDUyMC04RjBDLTcyMEVBRjA1OTkzNScsXG4gICAgfTtcblxuICAgIHRoaXMuY29uZmlndXJlKGRlZmF1bHRzKTtcblxuICAgIC8vIGxvY2FsIGF0dHJpYnV0ZXNcbiAgICB0aGlzLl9iZWFjb25EYXRhID0ge307XG4gICAgdGhpcy5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuICAgIHRoaXMuX2NvcmRvdmFQbHVnaW5JbnN0YWxsZWQgPSBmYWxzZTtcbiAgICB0aGlzLl90eFBvd2VyID0gLTU1O1xuICAgIHRoaXMuX2hhc0JlZW5DYWxpYnJhdGVkID0gZmFsc2U7XG5cbiAgICAvLyBiaW5kIGxvY2FsIG1ldGhvZHNcbiAgICB0aGlzLl9zdGFydEFkdmVydGlzaW5nID0gdGhpcy5fc3RhcnRBZHZlcnRpc2luZy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3N0b3BBZHZlcnRpc2luZyA9IHRoaXMuX3N0b3BBZHZlcnRpc2luZy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3N0YXJ0UmFuZ2luZyA9IHRoaXMuX3N0YXJ0UmFuZ2luZy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3N0b3BSYW5naW5nID0gdGhpcy5fc3RvcFJhbmdpbmcuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9kaWRSYW5nZUJlYWNvbnNJblJlZ2lvbiA9IHRoaXMuX2RpZFJhbmdlQmVhY29uc0luUmVnaW9uLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fY2hlY2tQbHVnaW4gPSB0aGlzLl9jaGVja1BsdWdpbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVzdGFydEFkdmVydGlzaW5nID0gdGhpcy5yZXN0YXJ0QWR2ZXJ0aXNpbmcuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlc3RhcnRSYW5naW5nID0gdGhpcy5yZXN0YXJ0UmFuZ2luZy5iaW5kKHRoaXMpO1xuXG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgaW5pdCgpIHtcblxuICAgIC8qKlxuICAgICAqIC0gdXVpZCByZXByZXNlbnQgdGhlIGJlYWNvbiByZWdpb24uIGEgZ2l2ZW4gcmFuZ2luZyBjYWxsYmFjayBjYW4gb2JseSBtb25pdG9yXG4gICAgICogYmVhY29ucyB3aXRoIHRoZSBzYW1lIHV1aWQsIGhlbmNlIHV1aWQgaW4gdGhlIHNvdW5kd29yayBiZWFjb24gc2VydmljZSBpcyBoYXJkY29kZWQuXG4gICAgICogLSBpZGVudGlmaWVyIGNhbWUgd2l0aCB0aGUgY29yZG92YS1wbHVnaW4taWJlYWNvbiBBUEksIG5vIHJlYWwgY3VlcyB3aHkgaXQncyB0aGVyZS5cbiAgICAgKiAtIG1ham9yIC8gbWlub3I6IGVhY2ggZW5jb2RlZCBvbiAxNiBiaXRzLCB0aGVzZSB2YWx1ZXMgYXJlIHRvIGJlIHVzZWQgdG8gZGVmaW5lZCBhXG4gICAgICogdW5pcXVlIHNvdW5kd29yayBjbGllbnQuXG4gICAgICovXG4gICAgdGhpcy5fYmVhY29uRGF0YSA9IHtcbiAgICAgIHV1aWQ6IHRoaXMub3B0aW9ucy51dWlkLFxuICAgICAgaWRlbnRpZmllcjogJ2FkdmVydGlzZWRCZWFjb24nLFxuICAgICAgbWFqb3I6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDY1NTAwKSxcbiAgICAgIG1pbm9yOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA2NTUwMClcbiAgICB9XG5cbiAgICAgIHRoaXMuX2NoZWNrUGx1Z2luKCk7XG4gICAgICB0aGlzLl9zdGFydEFkdmVydGlzaW5nKCk7XG4gICAgICB0aGlzLl9zdGFydFJhbmdpbmcoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgaWYgKCF0aGlzLmhhc1N0YXJ0ZWQpXG4gICAgICB0aGlzLmluaXQoKTtcblxuICAgIHRoaXMucmVhZHkoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZVxuICAvKiAgYXV0b21hdGljYWxseSBjYWxsZWQgd2l0aCB0aGlzLnJlYWR5KClcbiAgKi9cbiAgc3RvcCgpIHtcbiAgICBzdXBlci5zdG9wKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgaW52b2tlZHdoZW4gbmVpZ2hib3JpbmcgaWJlYWNvbiBsaXN0IGlzIHVwZGF0ZWRcbiAgICogKGkuZS4gZXZlcnkgbnRoIG1pbGxpc2VjLiBvbmNlIGEgc2luZ2xlIGJlYWNvbiBpcyByZWdpc3RlcmVkKVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKi9cbiAgYWRkTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICB0aGlzLl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAqIHJlbW92ZSByZWdpc3RlcmVkIGNhbGxiYWNrIGZyb20gc3RhY2sgKHNlZSBcImFkZENhbGxiYWNrXCIpXG4gICovXG4gIHJlbW92ZUxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuX2NhbGxiYWNrcy5oYXMoY2FsbGJhY2spKSB7XG4gICAgICB0aGlzLl9jYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiByZW1vdmUgcmVnaXN0ZXJlZCBjYWxsYmFjayBmcm9tIHN0YWNrIChzZWUgXCJhZGRDYWxsYmFja1wiKVxuICAqL1xuICByc3NpVG9EaXN0KHJzc2kpIHtcbiAgICBpZiAoIXRoaXMuX2hhc0JlZW5DYWxpYnJhdGVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ3Jzc2lUb0Rpc3QgY2FsbGVkIHByaW9yIHRvIHR4UG93ZXIgZGVmaW5pdGlvbiAoY2FsaWJyYXRpb24pLCB1c2luZyBkZWZhdWx0IHZhbHVlOicsIHRoaXMuX3R4UG93ZXIsICdkQicpO1xuICAgICAgdGhpcy5faGFzQmVlbkNhbGlicmF0ZWQgPSB0cnVlXG4gICAgfVxuICAgIGxldCBkaXN0ID0gdGhpcy5fY2FsY3VsYXRlQWNjdXJhY3kodGhpcy50eFBvd2VyLCByc3NpKTtcbiAgICByZXR1cm4gZGlzdDtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc3RhcnRBZHZlcnRpc2luZygpIHtcblxuICAgIGlmICh0aGlzLl9jb3Jkb3ZhUGx1Z2luSW5zdGFsbGVkKXtcblxuICAgICAgLy8gZGVmaW5lIGJlYWNvbiBwYXJhbWV0ZXJzXG4gICAgICB2YXIgdXVpZCA9IHRoaXMuX2JlYWNvbkRhdGEudXVpZDtcbiAgICAgIHZhciBpZGVudGlmaWVyID0gdGhpcy5fYmVhY29uRGF0YS5pZGVudGlmaWVyO1xuICAgICAgdmFyIG1pbm9yID0gdGhpcy5fYmVhY29uRGF0YS5taW5vcjtcbiAgICAgIHZhciBtYWpvciA9IHRoaXMuX2JlYWNvbkRhdGEubWFqb3I7XG4gICAgICB2YXIgYmVhY29uUmVnaW9uID0gbmV3IGNvcmRvdmEucGx1Z2lucy5sb2NhdGlvbk1hbmFnZXIuQmVhY29uUmVnaW9uKGlkZW50aWZpZXIsIHV1aWQsIG1ham9yLCBtaW5vcik7XG5cbiAgICAgIC8vIHZlcmlmeSB0aGUgcGxhdGZvcm0gc3VwcG9ydHMgdHJhbnNtaXR0aW5nIGFzIGEgYmVhY29uXG4gICAgICBjb3Jkb3ZhLnBsdWdpbnMubG9jYXRpb25NYW5hZ2VyLmlzQWR2ZXJ0aXNpbmdBdmFpbGFibGUoKVxuICAgICAgICAudGhlbihmdW5jdGlvbihpc1N1cHBvcnRlZCkge1xuXG4gICAgICAgICAgaWYgKGlzU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAvLyBzdGFydCBhZHZlcnRpc2luZ1xuICAgICAgICAgICAgY29yZG92YS5wbHVnaW5zLmxvY2F0aW9uTWFuYWdlci5zdGFydEFkdmVydGlzaW5nKGJlYWNvblJlZ2lvbilcbiAgICAgICAgICAgICAgLmZhaWwoY29uc29sZS5lcnJvcilcbiAgICAgICAgICAgICAgLmRvbmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBZHZlcnRpc2luZyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmZhaWwoZnVuY3Rpb24oZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9KVxuICAgICAgICAuZG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc3RvcEFkdmVydGlzaW5nKCkge1xuICAgIGlmICh0aGlzLl9jb3Jkb3ZhUGx1Z2luSW5zdGFsbGVkKXtcbiAgICAgIGNvcmRvdmEucGx1Z2lucy5sb2NhdGlvbk1hbmFnZXIuc3RvcEFkdmVydGlzaW5nKClcbiAgICAgICAgLmZhaWwoZnVuY3Rpb24oZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9KVxuICAgICAgICAuZG9uZSgpO1xuICAgICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zdGFydFJhbmdpbmcoKSB7XG5cbiAgICBpZiAodGhpcy5fY29yZG92YVBsdWdpbkluc3RhbGxlZCl7XG5cbiAgICAgIHZhciBkZWxlZ2F0ZSA9IG5ldyBjb3Jkb3ZhLnBsdWdpbnMubG9jYXRpb25NYW5hZ2VyLkRlbGVnYXRlKCk7XG4gICAgICBkZWxlZ2F0ZS5kaWRSYW5nZUJlYWNvbnNJblJlZ2lvbiA9IHRoaXMuX2RpZFJhbmdlQmVhY29uc0luUmVnaW9uO1xuICAgICAgY29yZG92YS5wbHVnaW5zLmxvY2F0aW9uTWFuYWdlci5zZXREZWxlZ2F0ZShkZWxlZ2F0ZSk7XG5cbiAgICAgIHZhciB1dWlkID0gdGhpcy5fYmVhY29uRGF0YS51dWlkO1xuICAgICAgdmFyIGlkZW50aWZpZXIgPSB0aGlzLl9iZWFjb25EYXRhLmlkZW50aWZpZXI7XG4gICAgICB2YXIgYmVhY29uUmVnaW9uID0gbmV3IGNvcmRvdmEucGx1Z2lucy5sb2NhdGlvbk1hbmFnZXIuQmVhY29uUmVnaW9uKGlkZW50aWZpZXIsIHV1aWQpO1xuXG4gICAgICAvLyByZXF1aXJlZCBpbiBpT1MgOCtcbiAgICAgIGNvcmRvdmEucGx1Z2lucy5sb2NhdGlvbk1hbmFnZXIucmVxdWVzdFdoZW5JblVzZUF1dGhvcml6YXRpb24oKTtcbiAgICAgIC8vIG9yIGNvcmRvdmEucGx1Z2lucy5sb2NhdGlvbk1hbmFnZXIucmVxdWVzdEFsd2F5c0F1dGhvcml6YXRpb24oKVxuXG4gICAgICBjb3Jkb3ZhLnBsdWdpbnMubG9jYXRpb25NYW5hZ2VyLnN0YXJ0UmFuZ2luZ0JlYWNvbnNJblJlZ2lvbihiZWFjb25SZWdpb24pXG4gICAgICAgIC5mYWlsKGZ1bmN0aW9uKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfSlcbiAgICAgICAgLmRvbmUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2RpZFJhbmdlQmVhY29uc0luUmVnaW9uKHBsdWdpblJlc3VsdCkge1xuICAgIC8vIGNhbGwgdXNlciBkZWZpbmVkIGNhbGxiYWNrc1xuICAgIHRoaXMuX2NhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayhwbHVnaW5SZXN1bHQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zdG9wUmFuZ2luZygpIHtcbiAgICBpZiAodGhpcy5fY29yZG92YVBsdWdpbkluc3RhbGxlZCl7XG4gICAgICB2YXIgdXVpZCA9IHRoaXMuX2JlYWNvbkRhdGEudXVpZDtcbiAgICAgIHZhciBpZGVudGlmaWVyID0gdGhpcy5fYmVhY29uRGF0YS5pZGVudGlmaWVyO1xuICAgICAgdmFyIGJlYWNvblJlZ2lvbiA9IG5ldyBjb3Jkb3ZhLnBsdWdpbnMubG9jYXRpb25NYW5hZ2VyLkJlYWNvblJlZ2lvbihpZGVudGlmaWVyLCB1dWlkKTtcblxuICAgICAgY29yZG92YS5wbHVnaW5zLmxvY2F0aW9uTWFuYWdlci5zdG9wUmFuZ2luZ0JlYWNvbnNJblJlZ2lvbihiZWFjb25SZWdpb24pXG4gICAgICAgIC5mYWlsKGZ1bmN0aW9uKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfSlcbiAgICAgICAgLmRvbmUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2NoZWNrUGx1Z2luKCkge1xuXG4gICAgdmFyIGRpc3BsYXlfaW5zdGFsbF9pbnN0cnVjdGlvbiA9IGZhbHNlO1xuXG4gICAgdmFyIHBsdWdpbnMgPSBjb3Jkb3ZhLnJlcXVpcmUoXCJjb3Jkb3ZhL3BsdWdpbl9saXN0XCIpLm1ldGFkYXRhO1xuICAgIGlmICh0eXBlb2YgcGx1Z2luc1tDT1JET1ZBX1BMVUdJTl9OQU1FXSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY29uc29sZS53YXJuKCdDb3Jkb3ZhIHBsdWdpbiA8Y29yZG92YS1wbHVnaW4taWJlYWNvbj4gbm90IGluc3RhbGxlZCAtPiBiZWFjb24gc2VydmljZSBkaXNhYmxlZCcpO1xuICAgICAgZGlzcGxheV9pbnN0YWxsX2luc3RydWN0aW9uID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHBsdWdpbnNbQ09SRE9WQV9QTFVHSU5fTkFNRV0gIT0gQ09SRE9WQV9QTFVHSU5fQVNTRVJURURfVkVSU0lPTikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0NvcmRvdmEgcGx1Z2luIDxjb3Jkb3ZhLXBsdWdpbi1pYmVhY29uPiB2ZXJzaW9uIG1pc21hdGNoOiBpbnN0YWxsZWQ6ICcgKyBwbHVnaW5zW0NPUkRPVkFfUExVR0lOX05BTUVdICsgJyByZXF1aXJlZDogJyArIENPUkRPVkFfUExVR0lOX0FTU0VSVEVEX1ZFUlNJT04gKyAnICh2ZXJzaW9uIG5vdCB0ZXN0ZWQsIHVzZSBhdCB5b3VyIG93biByaXNrKScpO1xuICAgICAgICBkaXNwbGF5X2luc3RhbGxfaW5zdHJ1Y3Rpb24gPSB0cnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5fY29yZG92YVBsdWdpbkluc3RhbGxlZCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChkaXNwbGF5X2luc3RhbGxfaW5zdHJ1Y3Rpb24pe1xuICAgICAgY29uc29sZS5sb2coJy0+IHRvIGluc3RhbGwgJyArIENPUkRPVkFfUExVR0lOX05BTUUgKyAnIHYnICsgQ09SRE9WQV9QTFVHSU5fQVNTRVJURURfVkVSU0lPTiArICcsIHVzZTonLCAnY29yZG92YSBwbHVnaW4gYWRkICcgKyBDT1JET1ZBX1BMVUdJTl9SRVBPU0lUT1JZICsgJyMnICsgQ09SRE9WQV9QTFVHSU5fQVNTRVJURURfVkVSU0lPTik7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlXG4gICogY29udmVydCByc3NpIHRvIGRpc3RhbmNlLCBuYW1pbmcgKF9jYWxjdWxhdGVBY2N1cmFjeSByYXRoZXIgdGhhbiBjYWxjdWxhdGVEaXN0YW5jZSlcbiAgKiBpcyBpbnRlbnRpb25hbDogVVNFIFdJVEggQ0FVVElPTiwgYXMgZXhwbGFpbmVkIEBcbiAgKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwNDE2MjE4L3VuZGVyc3RhbmRpbmctaWJlYWNvbi1kaXN0YW5jaW5nXG4gICovXG4gIF9jYWxjdWxhdGVBY2N1cmFjeSh0eFBvd2VyLCByc3NpKSB7XG4gICAgaWYgKHJzc2kgPT0gMCkge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG4gICAgbGV0IHJhdGlvID0gcnNzaSAqIDEuMCAvIHR4UG93ZXI7XG4gICAgaWYgKHJhdGlvIDwgMS4wKSB7XG4gICAgICByZXR1cm4gTWF0aC5wb3cocmF0aW8sIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICgwLjg5OTc2ICogTWF0aC5wb3cocmF0aW8sIDcuNzA5NSkgKyAwLjExMSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogR2V0IGFkdmVydGlzaW5nIGlCZWFjb24gcmVnaW9uIFVVSURcbiAgKi9cbiAgZ2V0IHV1aWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JlYWNvbkRhdGEudXVpZDtcbiAgfVxuICAvKipcbiAgKiBHZXQgYWR2ZXJ0aXNpbmcgaUJlYWNvbiBtYWpvciBJRFxuICAqL1xuICBnZXQgbWFqb3IgKCkge1xuICAgIHJldHVybiB0aGlzLl9iZWFjb25EYXRhLm1ham9yO1xuICB9XG4gIC8qKlxuICAqIEdldCBhZHZlcnRpc2luZyBpQmVhY29uIG1pbm9yIElEXG4gICovXG4gIGdldCBtaW5vciAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JlYWNvbkRhdGEubWlub3I7XG4gIH1cbiAgLyoqXG4gICogR2V0IHJlZmVyZW5jZSBzaWduYWwgc3RyZW5ndGgsIHVzZWQgZm9yIGRpc3RhbmNlIGVzdGltYXRpb24uXG4gICogdHhQb3dlciBpcyB0aGUgcnNzaSAoaW4gZEIpIGFzIG1lc3VyZWQgYnkgYW5vdGhlciBiZWFjb25cbiAgKiBsb2NhdGVkIGF0IDEgbWV0ZXIgYXdheSBmcm9tIHRoaXMgYmVhY29uLlxuICAqL1xuICBnZXQgdHhQb3dlciAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3R4UG93ZXI7XG4gIH1cblxuICAvKipcbiAgKiBTZXQgYWR2ZXJ0aXNpbmcgaUJlYWNvbiBVVUlEXG4gICogQHBhcmFtIHtTdHJpbmd9IHZhbCAtIG5ldyBVVUlEXG4gICovXG4gIHNldCB1dWlkKHZhbCkgeyAvLyBVU0UgQVQgWU9VUiBPV04gUklTS1NcbiAgICB0aGlzLl9iZWFjb25EYXRhLnV1aWQgPSB2YWw7XG4gICAgdGhpcy5vcHRpb25zLnV1aWQgPSB2YWw7XG4gICAgdGhpcy5fc3RvcFJhbmdpbmcoKTtcbiAgICB0aGlzLl9zdGFydFJhbmdpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAqIFNldCBhZHZlcnRpc2luZyBpQmVhY29uIG1ham9yIElEXG4gICogQHBhcmFtIHtOdW1iZXJ9IHZhbCAtIG5ldyBtYWpvciBJRFxuICAqL1xuICBzZXQgbWFqb3IgKHZhbCkge1xuICAgIGlmICggKHZhbCA8PSA2NTUzNSkgJiYgKHZhbCA+PSAwKSApe1xuICAgICAgdGhpcy5fYmVhY29uRGF0YS5tYWpvciA9IHZhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1dBUk5JTkc6IGF0dGVtcHQgdG8gZGVmaW5lIGludmFsaWQgbWFqb3IgdmFsdWU6ICcsIHZhbCwgJyAobXVzdCBiZSBpbiByYW5nZSBbMCw2NTUzNV0nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBTZXQgYWR2ZXJ0aXNpbmcgaUJlYWNvbiBtaW5vciBJRFxuICAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgLSBuZXcgbWlub3IgSURcbiAgKi9cbiAgc2V0IG1pbm9yICh2YWwpIHtcbiAgICBpZiAoICh2YWwgPD0gNjU1MzUpICYmICh2YWwgPj0gMCkgKXtcbiAgICAgIHRoaXMuX2JlYWNvbkRhdGEubWlub3IgPSB2YWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdXQVJOSU5HOiBhdHRlbXB0IHRvIGRlZmluZSBpbnZhbGlkIG1pbm9yIHZhbHVlOiAnLCB2YWwsICcgKG11c3QgYmUgaW4gcmFuZ2UgWzAsNjU1MzVdJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogR2V0IHJlZmVyZW5jZSBzaWduYWwgc3RyZW5ndGgsIHVzZWQgZm9yIGRpc3RhbmNlIGVzdGltYXRpb24uXG4gICogdHhQb3dlciBpcyB0aGUgcnNzaSAoaW4gZEIpIGFzIG1lc3VyZWQgYnkgYW5vdGhlciBiZWFjb25cbiAgKiBsb2NhdGVkIGF0IDEgbWV0ZXIgYXdheSBmcm9tIHRoaXMgYmVhY29uLlxuICAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgLSBuZXcgc2lnbmFsIHN0cmVuZ3RoIHJlZmVyZW5jZVxuICAqL1xuICBzZXQgdHhQb3dlciAodmFsKSB7XG4gICAgaWYgKCAodmFsIDw9IDApICYmICh2YWwgPj0gLTIwMCkgKXtcbiAgICAgIHRoaXMuX3R4UG93ZXIgPSB2YWw7XG4gICAgICB0aGlzLl9oYXNCZWVuQ2FsaWJyYXRlZCA9IHRydWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdXQVJOSU5HOiBhIHJlZmVyZW5jZSB0eFBvd2VyIHZhbHVlIG9mOiAnLCB2YWwsICcgZEIgaXMgdW5saWtlbHkgKHNldCBoYXMgYmVlbiByZWplY3RlZCknKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBSZXN0YXJ0IGFkdmVydGlzaW5nIHRvIHRha2UgaW50byBhY291bnQgdXVpZCwgbWFqb3Igb3IgbWlub3IgY2hhbmdlLlxuICAqL1xuICByZXN0YXJ0QWR2ZXJ0aXNpbmcoKSB7XG4gICAgdGhpcy5fc3RvcEFkdmVydGlzaW5nKCk7XG4gICAgdGhpcy5fc3RhcnRBZHZlcnRpc2luZygpO1xuICB9XG5cbiAgLyoqXG4gICogUmVzdGFydCByYW5naW5nIHRvIHRha2UgaW50byBhY291bnQgdXVpZCBjaGFuZ2UuXG4gICovXG4gIHJlc3RhcnRSYW5naW5nKCkge1xuICAgIHRoaXMuX3N0b3BSYW5naW5nKCk7XG4gICAgdGhpcy5fc3RhcnRSYW5naW5nKCk7XG4gIH1cblxufVxuXG5zZXJ2aWNlTWFuYWdlci5yZWdpc3RlcihTRVJWSUNFX0lELCBCZWFjb24pO1xuXG5leHBvcnQgZGVmYXVsdCBCZWFjb247XG4iXX0=