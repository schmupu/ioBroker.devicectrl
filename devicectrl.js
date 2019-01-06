/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';

const utils = require('@iobroker/adapter-core');
const rulesset = require(__dirname + '/lib/rules');
const request = require("request");
const sched = require("node-schedule");
const adapterName = require('./package.json').name.split('.').pop();
let rules = null;
let adapter;

function startAdapter(options) {
  options = options || {};
  options.name = adapterName;
  adapter = new utils.Adapter(options);

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
        break;
      case 'savea':
        r = rules.getRules();
        saveRulesSetAdpater(r);
        break;
      case 'loada':
        /*
        loadRulesSetAdapter((r) => {
          rules.addRules(r);
        });
        */
        (async () => {
          let r = await loadRulesSetAdapterAsync();
          rules.addRules(r);
        })();
        break;
      default:
    }

    (async () => {
      await executeRulesAsync(rules);
    })();
    adapter.sendTo(msg.from, msg.command, "Execute command " + command, msg.callback);

  });


  // *****************************************************************************************************
  // is called when databases are connected and adapter received configuration.
  // start here!
  // *****************************************************************************************************
  adapter.on('ready', () => {
    mainAsync();
  });


  return adapter;
}


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
// Read holidays Async
// *****************************************************************************************************
async function getFeiertagAsync(state, year) {
  return new Promise((resolve, reject) => {
    if (state) {
      if (!year) year = (new Date()).getFullYear();
      let url = "https://ipty.de/feiertag/api.php?do=getFeiertage&loc=" + state + "&jahr=" + year + "&outformat=Y-m-d";
      request({ url: url }, function (error, response, body) {
        if (body) {
          let result = JSON.parse(body);
          resolve(result);
        } else {
          resolve(null);
        }
      });
    }
  });
}

// *****************************************************************************************************
// Get coordinates
// *****************************************************************************************************
function getCoordnates(callback) {
  adapter.getForeignObject('system.config', (error, states) => {
    if (!error) {
      callback && callback({ latitude: states.common.latitude, longitude: states.common.longitude });
    } else {
      callback && callback();
    }
  });
}

// *****************************************************************************************************
// Get coordinates Async
// *****************************************************************************************************
async function getCoordnatesAsync() {
  try {
    let states = await adapter.getForeignObjectAsync('system.config');
    if (states && states.common && states.common.latitude && states.common.longitude) {
      return { latitude: states.common.latitude, longitude: states.common.longitude };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
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
// Relgelwerg speichern Async
// *****************************************************************************************************
async function loadHolidayAsync() {
  return new Promise((resolve, reject) => {
    let id = "config.holiday";
    adapter.log.info("Loading Holidays");
    adapter.getState(id, function (err, state) {
      if (!err && state && state.val) {
        state = JSON.parse(state.val);
        resolve(state || []);
      } else {
        resolve([]);
      }
    });
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
// Relgelwerg speichern Async
// *****************************************************************************************************
async function loadRulesSetAdapterAsync() {
  return new Promise((resolve, reject) => {
    let id = "config.ruleset";
    adapter.log.info("Loading Ruleset (Adapter)");
    adapter.getState(id, function (err, state) {
      if (!err && state && state.val) {
        state = JSON.parse(state.val);
        resolve(state || []);
      } else {
        resolve([]);
      }
    });
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
// Relgelwerg speichern Async
// *****************************************************************************************************
async function loadRulesSetAsync() {
  return new Promise((resolve, reject) => {
    let id = "system.adapter." + adapter.namespace;
    adapter.log.info("Loading Ruleset");
    adapter.getForeignObject(id, function (err, obj) {
      if (!err) {
        adapter.log.info("Loading Ruleset successfull");
        resolve(obj.native.ruleset || []);
      } else {
        resolve([]);
      }
    });
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
  });
}

// *****************************************************************************************************
// Execute Rules Async
// *****************************************************************************************************
function executeRulesAsync(rules) {
  (async () => {
    try {
      let simulation = adapter.config.simulation || false;
      let values = await rules.executeRulesAsync();

      if (values) {
        adapter.log.debug(JSON.stringify(values));
        if (simulation) {
          // adapter.log.info("Simulation " + values.rulename + ", alte Regel " + values.oldRegel + ", neue Regel " + values.regel + ", von altem Wert " + values.oldValue + " auf neuen Wert " + values.value);                         
        } else {
          // adapter.log.info(values.rulename + ", alte Regel " + values.oldRegel + ", neue Regel " + values.regel + ", von altem Wert " + values.oldValue + " auf neuen Wert " + values.value);                                
        }
      }

    } catch (error) {
      adapter.log.error(error);
    }
  })();
}


// *****************************************************************************************************
// Main
// *****************************************************************************************************
function main() {
  rules = new rulesset.RulesControler(adapter);
  let cal = adapter.config.holiday || 'HH';
  let simulation = adapter.config.simulation || false;

  (async () => {
    let ba = await test();
    let a = ba;
  })();

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

// *****************************************************************************************************
// Main
// *****************************************************************************************************
function mainAsync() {

  (async () => {

    rules = new rulesset.RulesControlerAsync(adapter);
    let cal = adapter.config.holiday || 'HH';
    let simulation = adapter.config.simulation || false;

    adapter.log.info("Starting Adapter");

    //Get every Jear new Hollidays
    sched.scheduleJob('1 0 * * *', () => {
      (async () => {
        let holidays = await getFeiertagAsync(cal);
        if (holidays) {
          adapter.log.info("Got new holidays");
          rules.setHolidays(holidays);
          saveHolidays(holidays);
        }
        let coord = await getCoordnatesAsync();
        if (coord) {
          rules.setCoordinates(coord.latitude, coord.longitude);
          adapter.log.info("Got coordinates!");
        }
      })();
    });

    // on every Start get Holidays
    let holidays = await getFeiertagAsync(cal);
    if (holidays) {
      adapter.log.info("Got new holidays");
      rules.setHolidays(holidays);
      saveHolidays(holidays);
    }

    let coord = await getCoordnatesAsync()
    if (coord) {
      rules.setCoordinates(coord.latitude, coord.longitude);
      adapter.log.info("Got coordinates!");
    }

    let r = await loadRulesSetAsync()
    rules.addRules(r);
    // showRules();
    await executeRulesAsync(rules);
    setInterval(() => {
      (async () => {
        await executeRulesAsync(rules);
      })();
    }, adapter.config.pollInterval * 1000);

  })();

}


// If started as allInOne mode => return function to create instance
if (typeof module !== undefined && module.parent) {
  module.exports = startAdapter;
} else {
  // or start the instance directly
  startAdapter();
}