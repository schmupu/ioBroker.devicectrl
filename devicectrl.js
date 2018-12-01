'use strict';

var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var dp = require(__dirname + '/lib/datapoints');
var rulesset = require(__dirname + '/lib/rules');
var net = require('net');
var adapter = new utils.Adapter('devicectrl');
var vm = require('vm');
var rules = null;
var request = require("request");
var sched = require("node-schedule");

// *****************************************************************************************************
// is called when adapter shuts down - callback has to be called under any circumstances!
// *****************************************************************************************************
adapter.on('unload', (callback) => {
  try {
    adapter.log.info('Closing Adapter');
    callback();
  } catch (e) {
    // adapter.log.error('Error');
    callback();
  }
});


// *****************************************************************************************************
// Listen for sendTo messages
// *****************************************************************************************************
adapter.on('message', (msg) => {

  let command = msg.command;
  let parameter = msg.message;
  let callback = msg.callback;
  let id = msg._id;
  let r;

  switch (command) {
    case 'add':
      if (parameter) {
        adapter.log.info("Add Rule : " + parameter.rulename);
        rules.addRule(parameter);
      }
      break;
    case 'delete':
      if (parameter) {
        adapter.log.info("Delete Rule : " + parameter);
        rules.deleteRule(parameter);
      }
      break;
    case 'holiday':
      rules.setHolidays(parameter);
      break;
    case 'save':
      r = rules.getRules();
      saveRulesSet(r);
    case 'savea':
      r = rules.getRules();
      saveRulesSetAdpater(r);
      break;
    case 'loada':
      loadRulesSetAdapter((r) => {
        rules.addRules(r);
      });
      break;
    default:
      break;
  }

  executeRules(rules);
  adapter.sendTo(msg.from, msg.command, "Execute command " + command, msg.callback);

});


// *****************************************************************************************************
// is called when databases are connected and adapter received configuration.
// start here!
// *****************************************************************************************************
adapter.on('ready', () => {
  main();
});

// *****************************************************************************************************
// Read holidays
// *****************************************************************************************************

function getFeiertag(state, callback, year) {

  if (state) {
    if (!year) year = (new Date()).getFullYear();
    let url = "https://ipty.de/feiertag/api.php?do=getFeiertage&loc=" + state + "&jahr=" + year + "&outformat=Y-m-d";
    request({ url: url }, function (error, response, body) {
      if (body) {
        let result = JSON.parse(body);
        callback && callback(result);
      } else {
        callback && callback();
      }
    });
  }

}

// *****************************************************************************************************
// Get coordinates
// *****************************************************************************************************
function getCoordnates(callback) {
  adapter.getForeignObject('system.config', (error, states) => {
    if (states.common.latitude && states.common.longitude) {
      callback && callback({ latitude: states.common.latitude, longitude: states.common.longitude });
    } else {
      callback && callback();
    }
  });
}


// *****************************************************************************************************
// Save Holidays
// *****************************************************************************************************
function saveHolidays(holiday) {
  if (holiday) {
    let id = "config.holiday";
    holiday = JSON.stringify(holiday);
    adapter.log.info("Saving Holidays");
    adapter.setState(id, holiday, true, function (err) {
      if (!err) {
        adapter.log.info("Saving Holidays successfull");
      }
    });
  }
}


// *****************************************************************************************************
// Relgelwerg speichern
// *****************************************************************************************************
function loadHoliday(callback) {
  let id = "config.holiday";
  adapter.log.info("Loading Holidays");
  adapter.getState(id, function (err, state) {
    if (!err && state && state.val) {
      state = JSON.parse(state.val);
      callback && callback(state || []);
    } else {
      callback && callback([]);
    }
  });
}


// *****************************************************************************************************
// Relgelwerg speichern
// *****************************************************************************************************
function saveRulesSetAdpater(ruleset) {
  if (ruleset) {
    let id = "config.ruleset";
    ruleset = JSON.stringify(ruleset);
    adapter.log.info("Saving Ruleset (Adapter)");
    adapter.setState(id, ruleset, true, function (err) {
      if (!err) {
        adapter.log.info("Saving Ruleset successfull");
      }
    });
  } else {
    adapter.log.info("Nothing to save");
  }
}


// *****************************************************************************************************
// Relgelwerg speichern
// *****************************************************************************************************
function loadRulesSetAdapter(callback) {
  let id = "config.ruleset";
  adapter.log.info("Loading Ruleset (Adapter)");
  adapter.getState(id, function (err, state) {
    if (!err && state && state.val) {
      state = JSON.parse(state.val);
      callback && callback(state || []);
    } else {
      callback && callback([]);
    }
  });
}

// *****************************************************************************************************
// Relgelwerg speichern
// *****************************************************************************************************
function saveRulesSet(ruleset) {
  if (ruleset) {
    let id = "system.adapter." + adapter.namespace;
    adapter.log.info("Saving Ruleset");
    adapter.getForeignObject(id, function (err, obj) {
      obj.native.ruleset = ruleset;
      adapter.setForeignObject(id, obj, function (err) {
        adapter.log.info("Saving Ruleset successfull");
      });
    });
  }
}

// *****************************************************************************************************
// Relgelwerg speichern
// *****************************************************************************************************
function loadRulesSet(callback) {
  let id = "system.adapter." + adapter.namespace;
  adapter.log.info("Loading Ruleset");
  adapter.getForeignObject(id, function (err, obj) {
    if (!err) {
      adapter.log.info("Loading Ruleset successfull");
      callback && callback(obj.native.ruleset || []);
    } else {
      callback && callback([]);
    }
  });
}

// *****************************************************************************************************
// show Rules
// *****************************************************************************************************
function showRules(r) {
  if (!r) r = rules.getRules();
  let count = 0;
  for (let i in r) {
    if (r[i].rulename) {
      count++;
      adapter.log.info(count + ".) Load Rule " + r[i].rulename + ", Aktiv: " + r[i].active);
    }
  }
}

// *****************************************************************************************************
// Execute Rules
// *****************************************************************************************************
function executeRules(rules) {
  let simulation = adapter.config.simulation || false;
  rules.executeRules((error, values) => {
    if (!error && values) {
      adapter.log.debug(JSON.stringify(values));
      if (simulation) {
        // adapter.log.info("Simulation " + values.rulename + ", alte Regel " + values.oldRegel + ", neue Regel " + values.regel + ", von altem Wert " + values.oldValue + " auf neuen Wert " + values.value);                         
      } else {
        // adapter.log.info(values.rulename + ", alte Regel " + values.oldRegel + ", neue Regel " + values.regel + ", von altem Wert " + values.oldValue + " auf neuen Wert " + values.value);                                
      }
    } else if (error) {
      adapter.log.error(error);
    }
  })

}


// *****************************************************************************************************
// Main
// *****************************************************************************************************
function main() {
  rules = new rulesset(adapter);
  let cal = adapter.config.holiday || 'HH';
  let simulation = adapter.config.simulation || false;

  adapter.log.info("Starting Adapter");

  //Get every Jear new Hollidays
  sched.scheduleJob('1 0 * * *', function () {
    getFeiertag(cal, (holidays) => {
      if (holidays) {
        adapter.log.info("Got new holidays");
        rules.setHolidays(holidays);
      }
    });
    getCoordnates((coord) => {
      if (coord) {
        rules.setCoordinates(coord.latitude, coord.longitude);
        adapter.log.info("Got coordinates!");
      }
    });
  });


  // on every Start get Holidays
  getFeiertag(cal, (holidays) => {
    if (holidays) {
      adapter.log.info("Got new holidays");
      rules.setHolidays(holidays);
    }

    getCoordnates((coord) => {
      if (coord) {
        rules.setCoordinates(coord.latitude, coord.longitude);
        adapter.log.info("Got coordinates!");
      }

      loadRulesSet((r) => {

        rules.addRules(r);
        // showRules();
        executeRules(rules);


        setInterval(() => {
          executeRules(rules);
        }, adapter.config.pollInterval * 1000);
      });

    });

  });

}