var exec = require('cordova/exec');

var PLUGIN_NAME = 'IonicCouchbaseLite';

function extend(base, obj) {
  for (var i in obj) {
     if (obj.hasOwnProperty(i)) {
        base[i] = obj[i];
     }
  }
};

var IonicCouchbaseLite = {
  exec: function (actionName, args) {
    return new Promise(function(resolve, reject) {
      exec(
        function(data) {
          resolve(data);
        },
        function(err) {
          reject(err);
        },
        PLUGIN_NAME,
        actionName,
        args
      );
    });
  },
  watch: function(actionName, args, cb, err) {
    exec(
      cb,
      err,
      PLUGIN_NAME,
      actionName,
      args
    );
  }
}

module.exports = IonicCouchbaseLite;
