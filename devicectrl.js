/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';

const utils = require('@iobroker/adapter-core');
const rulesset = require(__dirname + '/lib/rules');
const request = require('request');
const sched = require('node-schedule');
const semver = require('semver');
const adapterName = require('./package.json').name.split('.').pop();
const adapterNodeVer = require('./package.json').engines.node;

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
    (async () => {
      try {
        let command = msg.command;
        let parameter = msg.message;
        let r = undefined;

        switch (command) {
          case 'add':
            if (parameter) {
              adapter.log.info('Add Rule : ' + parameter.rulename);
              await rules.addRule(parameter);
            }
            break;
          case 'delete':
            if (parameter) {
              adapter.log.info('Delete Rule : ' + parameter);
              await rules.deleteRule(parameter);
            }
            break;
          case 'holiday':
            rules.setHolidays(parameter);
            break;
          case 'save':
            r = rules.getRules();
            await saveRulesSetAsync(r);
            break;
          case 'savea':
            r = rules.getRules();
            await saveRulesSetAdpaterAsync(r);
            break;
          case 'loada':
            r = await loadRulesSetAdapterAsync();
            await rules.addRules(r);
            break;
          default:
        }
        await executeRulesAsync(rules);
        adapter.sendTo(msg.from, msg.command, 'Execute command ' + command, msg.callback);
      } catch (error) {
        adapter.log.error(error);
      }
    })();
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
// Read holidays Async
// *****************************************************************************************************
async function getFeiertagAsync(state, year) {
  return new Promise((resolve, reject) => {
    if (state) {
      if (!year) year = (new Date()).getFullYear();
      let url = 'https://ipty.de/feiertag/api.php?do=getFeiertage&loc=' + state + '&jahr=' + year + '&outformat=Y-m-d';
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
async function saveHolidaysAsync(holiday) {
  if (holiday) {
    try {
      let id = 'config.holiday';
      holiday = JSON.stringify(holiday);
      await adapter.setStateAsync(id, holiday, true);
      adapter.log.info('Saving Holidays');
    } catch (error) {
      adapter.log.info('Error, saving Holidays');
    }
  }
}

// *****************************************************************************************************
// Relgelwerg laden Async
// *****************************************************************************************************
async function loadHolidayAsync() {
  try {
    let id = 'config.holiday';
    let state = await adapter.getStateAsync(id);
    if (state && state.val) {
      state = JSON.parse(state.val);
      return state || [];
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

// *****************************************************************************************************
// Relgelwerg speichern Async
// *****************************************************************************************************
async function saveRulesSetAdpaterAsync(ruleset) {
  if (ruleset) {
    try {
      let id = 'config.ruleset';
      ruleset = JSON.stringify(ruleset);
      adapter.log.info('Saving Ruleset (Adapter)');
      await adapter.setStateAsync(id, ruleset, true);
      adapter.log.info('Saving Ruleset successfull');
    } catch (error) {
      adapter.log.info('Nothing to save');
    }
  }
}

// *****************************************************************************************************
// Relgelwerg Laden Async
// *****************************************************************************************************
async function loadRulesSetAdapterAsync() {
  try {
    let id = 'config.ruleset';
    adapter.log.info('Loading Ruleset (Adapter)');
    let state = await adapter.getStateAsync(id);
    if (state && state.val) {
      state = JSON.parse(state.val);
      return state || [];
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

// *****************************************************************************************************
// Relgelwerg speichern Async
// *****************************************************************************************************
async function saveRulesSetAsync(ruleset) {
  if (ruleset) {
    try {
      let id = 'system.adapter.' + adapter.namespace;
      adapter.log.info('Saving Ruleset');
      let obj = await adapter.getForeignObjectAsync(id);
      obj.native.ruleset = ruleset;
      await adapter.setForeignObject(id, obj);
      adapter.log.info('Saving Ruleset successfull');
    } catch (error) {
      adapter.log.eror('Erro saving Ruleset');
    }
  }
}

// *****************************************************************************************************
// Relgelwerg load Async
// *****************************************************************************************************
async function loadRulesSetAsync() {
  try {
    let id = 'system.adapter.' + adapter.namespace;
    adapter.log.info('Loading Ruleset');
    let obj = await adapter.getForeignObjectAsync(id);
    adapter.log.info('Loading Ruleset successfull');
    return obj.native.ruleset || [];
  } catch (error) {
    return [];
  }
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
      adapter.log.info(count + '.) Load Rule ' + r[i].rulename + ', Aktiv: ' + r[i].active);
    }
  }
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
          // adapter.log.info('Simulation ' + values.rulename + ', alte Regel ' + values.oldRegel + ', neue Regel ' + values.regel + ', von altem Wert ' + values.oldValue + ' auf neuen Wert ' + values.value);                         
        } else {
          // adapter.log.info(values.rulename + ', alte Regel ' + values.oldRegel + ', neue Regel ' + values.regel + ', von altem Wert ' + values.oldValue + ' auf neuen Wert ' + values.value);                                
        }
      }

    } catch (error) {
      adapter.log.error(error);
    }
  })();
}

// *****************************************************************************************************
// Intersection of 2 Arrays
// *****************************************************************************************************
function intersection(array1, array2) {
  return array1.filter((value) => -1 !== array2.indexOf(value));
}

function intersectionArrays(arraylist) {
  let array1 = arraylist.shift();
  let array2;
  while ((array2 = arraylist.shift())) {
    array1 = intersection(array1, array2);
  }
  return array1;
}

// *****************************************************************************************************
// Get List of all state id for enum
// *****************************************************************************************************
async function getStateIdfromEnums(enums) {
  let ret = [];
  let objs = await adapter.getForeignObjectsAsync('*', 'state');
  enums = (typeof enums === 'string') ? [enums] : enums;
  for (let o in objs) {
    let e = objs[o].enums;
    if (e && Object.keys(e).length !== 0) {
      for (let i in enums) {
        if (e.hasOwnProperty(enums[i])) {
          ret.push(o);
          break;
        }
      }
    }
  }
  return ret;
}

async function test() {

  let ems = await adapter.getEnumsAsync('functions.light');
  adapter.log.info(JSON.stringify(ems));
  let em = await adapter.getEnumAsync('functions.light');
  adapter.log.info(JSON.stringify(em));

  let objs1 = await getStateIdfromEnums('enum.functions.light');
  let objs2 = await getStateIdfromEnums('enum.rooms.living_room');
  let objs3 = intersectionArrays([objs2, objs1, objs2, objs1]);
  adapter.log.info(JSON.stringify(objs3));

}

// *****************************************************************************************************
// Main
// *****************************************************************************************************
function mainAsync() {

  adapter.log.info('Starting Adapter ' + adapter.namespace + ' in version ' + adapter.version);
  if (!semver.satisfies(process.version, adapterNodeVer)) {
    adapter.log.error(`Required node version ${adapterNodeVer} not satisfied with current version ${process.version}.`);
    return;
  }

  (async () => {
    // await test();
    rules = new rulesset.RulesControlerAsync(adapter);
    let cal = adapter.config.holiday || 'HH';

    //Get every Jear new Hollidays
    sched.scheduleJob('1 0 * * *', () => {
      (async () => {
        let holidays = await getFeiertagAsync(cal);
        if (holidays) {
          adapter.log.info('Got new holidays');
          rules.setHolidays(holidays);
          await saveHolidaysAsync(holidays);
        }
        let coord = await getCoordnatesAsync();
        if (coord) {
          rules.setCoordinates(coord.latitude, coord.longitude);
          adapter.log.info('Got coordinates!');
        }
      })();
    });

    // on every Start get Holidays
    let holidays = await getFeiertagAsync(cal);
    if (holidays) {
      adapter.log.info('Got new holidays');
      rules.setHolidays(holidays);
      await saveHolidaysAsync(holidays);
    }

    let coord = await getCoordnatesAsync();
    if (coord) {
      rules.setCoordinates(coord.latitude, coord.longitude);
      adapter.log.info('Got coordinates!');
    }

    let r = await loadRulesSetAsync();
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
if (typeof module !== 'undefined' && module.parent) {
  module.exports = startAdapter;
} else {
  // or start the instance directly
  startAdapter();
}