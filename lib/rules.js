/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';

const vm = require('vm');
const time = require(__dirname + '/time');

/**
 * actual month in '10,11,1,2' 
 * @param {*} month 
 */
function isMonth(month) {
  if (!month || month == '') return true;
  let d = new Date();
  let m = 1 * d.getMonth();
  let s = month.split(',');
  for (let i in s) {
    if (m == (1 * s[i])) return true;
  }
  return false;
}

/**
 * Sind 2 Werte gleich, egal welcher Typ
 * @param {*} a 
 * @param {*} b 
 */
function isEquivalent(a, b) {
  /*    
  if(typeof a !== typeof b) {
      return false;
  } 
  */
  if (typeof a === 'object' && typeof b === 'object') {
    // Create arrays of property names
    let aProps = Object.getOwnPropertyNames(a);
    let bProps = Object.getOwnPropertyNames(b);
    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
      return false;
    }
    for (let i = 0; i < aProps.length; i++) {
      let propName = aProps[i];
      // If values of same property are not equal,
      // objects are not equivalent
      if (a[propName] !== b[propName]) {
        return false;
      }
    }
    // If we made it this far, objects
    // are considered equivalent
    return true;
  } else {
    return a == b ? true : false;
  }
}

/**
 * Get Weekday back
 */
function getWeekday() {
  let d = new Date();
  let weekday = new Array(7);
  weekday[0] = 'Su';
  weekday[1] = 'Mo';
  weekday[2] = 'Tu';
  weekday[3] = 'We';
  weekday[4] = 'Th';
  weekday[5] = 'Fr';
  weekday[6] = 'Sa';
  return weekday[d.getDay()];
}

/**
 * is today an holiday
 * @param {string} weekday 
 * @param {string} feiertage 
 */
function isHoliday(weekday, feiertage) {
  if (!feiertage || !weekday) return false;
  let tmp = weekday.toString().trim().replace(/(\r\n|\n|\r|\t|\s)/g, '');
  let wtag = tmp.split(',');
  let found = false;
  for (let i = 0; i < wtag.length; i++) {
    if (wtag[i] == 'Hd') {
      found = true;
    }
  }
  if (found) {
    let now = new Date();
    let day = now.getDate();
    let month = now.getMonth() + 1;
    let year = now.getFullYear();
    day = ((day < 10) ? '0' + day : day);
    month = ((month < 10) ? '0' + month : month);
    let datum = year + '-' + month + '-' + day;
    let result = feiertage; // JSON.parse(feiertage);
    if (result) {
      for (let i = 0; i < result.length; i++) {
        let dat = result[i].date;
        if (datum.indexOf(dat) != -1) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Prüft ob der heutige Tag z.B. Di im String 'Mo,Di,...' erhalten ist
 * @param {*} weekday 
 */
function isWeekday(weekday) {
  if (typeof weekday == 'undefined' || weekday === '') { return true; }
  let tmp = weekday.toString().trim().replace(/(\r\n|\n|\r|\t|\s)/g, '');
  let wtag = tmp.split(',');
  let today = getWeekday();
  let urlaub = false; // onVacation(); // befinde ich mich im Urlaub
  // Wenn Feiertag oder Urlaub dann tun wir so ob Samstag wäre
  // Hd oder Vc
  if (urlaub === true) {
    today = 'Sa';
  }
  for (let i = 0; i < wtag.length; i++) {
    if (wtag[i] == today) {
      return true;
    }
  }
  return false;
}


/**
 * Read Status for an Array of ID as Promisse All 
 * @param {*} adapter 
 * @param {*} idAarray 
 * @param {*} callback 
 */
function getStatesByArray(adapter, idAarray, callback) {
  if (!idAarray) return callback && callback('idArray missing in function getStatesByArray');
  function getState(id) {
    let getStatePromise = new Promise(
      (resolve, reject) => {
        adapter.getForeignState(id, (err, state) => {
          if (!err) {
            resolve(state); // fulfilled
          } else {
            resolve(undefined); // nothing found
          }
        });
      });
    return getStatePromise;
  }
  let promisArray = [];
  for (let i in idAarray) {
    let id = idAarray[i];
    promisArray.push(getState(id));
  }
  Promise.all(promisArray).then((values) => {
    callback && callback(null, values);
  }).catch((error) => {
    callback && callback('Error in getStatesByArray in function Promise.All : ' + error);
  });
}

/**
 * 
 * @param {*} adapter 
 * @param {*} objArray 
 * @param {*} callback 
 */
function getStatesByObjectArray(adapter, objArray, callback) {
  if (!objArray) return callback && callback('ObjArray missing in function getStatesByObjectArray');
  let arr = [];
  for (let i in objArray) {
    let obj = objArray[i];
    let id = obj.id || undefined;
    arr.push(id);
  }
  getStatesByArray(adapter, arr, (error, values) => {
    for (let i = 0; i < objArray.length; i++) {
      let val = values[i] ? values[i] : null;
      let obj = objArray[i];
      obj.oldValue = obj.hasOwnProperty('value') ? obj.oldValue = obj.value : obj.oldValue = undefined;
      obj.value = val && val.hasOwnProperty('val') ? val.val : null;
      if (obj.hasOwnProperty('cmpvalue')) {
        obj.value = isEquivalent(obj.value, obj.cmpvalue);
      }
    }
    callback && callback(error, objArray);
  });
}

/**
 *  Copy form input obj only the fields name, value and oldValue
 * @param {*} objArrays 
 */
function buildEvalObjects(objArrays) {
  let resultAll = {};
  for (let i in objArrays) {
    let objArray = objArrays[i];
    let result = {};
    for (let j in objArray) {
      let obj = objArray[j];
      if (obj.hasOwnProperty('name') && obj.hasOwnProperty('value')) {
        //result[obj.name] = { value: obj.value, oldValue: obj.oldValue }
        result[obj.name] = { v: obj.value, ov: obj.oldValue };
        // result[obj.name] = obj.value;
      }
    }
    resultAll = Object.assign(resultAll, result);
  }
  return resultAll;
}

/**
 * Objekte kopieren
 * @param {obj} obj 
 */
function copyObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}




/**
 * Controler Async
 */
class RulesControlerAsync {
  constructor(adapter) {
    this.adapter = adapter;
    this.simulation = adapter.config.simulation || false;
    this.ruleset = [];
    this.feiertage = [];
    this.latitude;
    this.longitude;
    this.times = new time.Time({ 'adapter': this.adapter, 'latitude': this.latitude, 'longitude': this.longitude });
    this.onStateChange();
  }

  init(rule) {
    if (rule) {
      this.adapter.log.debug('Staring init with rule: ' + JSON.stringify(rule));
      rule.regel = undefined;
      rule.oldRegel = undefined;
      rule.value = undefined;
      rule.oldValue = undefined;
      if (!rule.hasOwnProperty('time')) { rule.time = {}; }
      if (!rule.hasOwnProperty('state')) { rule.state = {}; }
      if (!rule.hasOwnProperty('rule')) { rule.rule = {}; }
      return rule;
    }
  }

  async onStateChange() {
    // is called if a subscribed state changes
    this.adapter.on('stateChange', async (id, state) => {
      for (let i in this.ruleset) {
        let rule = this.ruleset[i];
        if (rule && rule.active) {
          let states = rule.state;
          for (let j in states) {
            let ids = states[j].id;
            if (ids == id) {
              // found
              await this.executeRulesAsync(rule);
            }
          }
        }
      }
    });
  }

  async addRule(rule) {
    if (rule) {
      this.adapter.log.debug('Staring addRule with rule: ' + JSON.stringify(rule));
      let rulename = rule.rulename;
      this.deleteRule(rulename);
      rule = this.init(copyObject(rule));
      this.ruleset.push(rule);
      this.addObjectAsync(rule);
    }
  }

  async addSubcribeState(rule) {
    if (rule && rule.active) {
      this.adapter.log.debug('Staring addSubcribeState with rule: ' + JSON.stringify(rule));
      let states = rule.state;
      for (let i in states) {
        let id = states[i].id;
        if (id) {
          await this.adapter.subscribeForeignStatesAsync(id);
        }
      }
    }
  }

  async addRules(ruleset) {
    if (ruleset) {
      this.adapter.log.debug('Staring addRules with rule: ' + JSON.stringify(ruleset));
      for (let i in ruleset) {
        this.addRule(ruleset[i]);
        // this.addSubcribeState(ruleset[i]);
      }
      this.delObjectsAsync(ruleset);
    }
  }

  async deleteRule(rulename) {
    // delete all
    if (rulename == '*') {
      this.ruleset = [];
    }
    // delete  entries by rulename
    for (let i = this.ruleset.length - 1; i >= 0; i--) {
      let rule = this.ruleset[i];
      if (rule.rulename == rulename) {
        this.ruleset.splice(i, 1);
      }
    }
    // this.delObjects(this.ruleset);
  }

  getRules() {
    return this.ruleset;
  }

  async addObjectAsync(rule) {
    if (rule && rule.rulename) {
      try {
        let rulename = rule.rulename;
        let deviceid = this.adapter.namespace + '.rules';
        let channelid = deviceid + '.' + rulename.replace(/[^0-9a-zA-Z]/g, '');
        await this.adapter.setObjectNotExistsAsync(deviceid, {
          type: 'device',
          common: {
            name: 'Rules'
          }
        });
        await this.adapter.setObjectNotExistsAsync(channelid, {
          type: 'channel',
          common: {
            name: 'Rule ' + rule.rulename
          }
        });
        let id = channelid + '.rule';
        await this.adapter.setObjectNotExistsAsync(id, {
          type: 'state',
          common: {
            name: 'rule',
            type: 'string',
            role: 'value',
            read: true,
            write: false
          }
        });
        id = channelid + '.ruleset';
        await this.adapter.setObjectNotExistsAsync(id, {
          type: 'state',
          common: {
            name: 'Ruleset',
            type: 'string',
            role: 'value',
            read: true,
            write: false
          }
        });
        /*
        id = channelid + '.value';
        await this.adapter.setObjectNotExistsAsync(id, {
          type: 'state',
          common: {
            name: 'Value',
            type: 'mixed',
            role: 'value',
            read: true,
            write: false
          }
        });
        */
        id = channelid + '.id';
        await this.adapter.setObjectNotExistsAsync(id, {
          type: 'state',
          common: {
            name: 'Id',
            type: 'string',
            role: 'value',
            read: true,
            write: false
          }
        });
        id = channelid + '.active';
        await this.adapter.setObjectNotExistsAsync(id, {
          type: 'state',
          common: {
            name: 'Active',
            type: 'boolean',
            role: 'value',
            read: true,
            write: false
          }
        });
      } catch (error) {
        // Error Message
      }
    }
  }

  async addObjects() {
    for (let i in this.ruleset) {
      let rule = this.ruleset[i];
      this.addObjectAsync(rule);
    }
    this.delObjectsAsync(this.ruleset);
  }

  async delObjectsAsync(ruleset) {
    try {
      let found = false;
      let deviceid = this.adapter.namespace + '.rules';
      let channel = await this.adapter.getChannelsOfAsync(deviceid);
      for (let i in channel) {
        let obj = channel[i];
        let channelid = obj._id;
        let channelname = channelid.split('.').slice(-1).join();
        found = false;
        for (let j in ruleset) {
          let rule = ruleset[j];
          let rulename = rule.rulename.replace(/[^0-9a-zA-Z]/g, '');
          if (channelname == rulename) {
            found = true;
            break;
          }
        }
        if (found == false) {
          await this.adapter.deleteChannelAsync(deviceid, channelname);
        }
      }
    } catch (error) {
      // Error Message
    }
  }

  async delObjectAsync(rulename) {
    try {
      let deviceid = this.adapter.namespace + '.rules';
      let channel = await this.adapter.getChannelsOfAsync(deviceid);
      for (let i in channel) {
        let obj = channel[i];
        let channelid = obj._id;
        let channelname = channelid.split('.').slice(-1).join();
        if (rulename) {
          rulename = rulename.replace(/[^0-9a-zA-Z]/g, '');
          if (channelname == rulename || rulename == '*') {
            await this.adapter.deleteChannelAsync(deviceid, channelname);
          }
        }
      }
    } catch (error) {
      // Error Message
    }
  }

  setHolidays(feiertage) {
    this.feiertage = feiertage;
  }

  setCoordinates(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  /**
   * is curent time in object
   * obj = { name: 't2', from: '19:00', to: '23:00', weekday: 'Fr,Sa' }
   * @param {*} rulename 
   * @param {*} obj 
   * @param {*} feiertage 
   */
  inTime(rulename, obj, feiertage) {
    if (obj) {
      let name = rulename + '_' + obj.name;
      if (obj.duration) {
        obj.duration = this.times.getTimeFromRange(name + '_duration', obj.duration);
      }
      if (obj.from) {
        obj.from = this.times.getTimeFromRange(name + '_from', obj.from);
      }
      if (obj.to) {
        obj.to = this.times.getTimeFromRange(name + '_to', obj.to);
      }
      if (!obj.from && obj.to && obj.duration) {
        obj.from = this.times.timePlusTime(obj.to, obj.duration);
      }
      if (obj.from && !obj.to && obj.duration) {
        obj.to = this.times.timePlusTime(obj.from, obj.duration);
      }
      if (!obj.weekday) { obj.weekday = ''; }
      let value = this.times.getTimeInMaxMinRange(obj.from, obj.range) && this.times.getTimeInMaxMinRange(obj.to, obj.range);
      value = value && this.times.compareTime(obj.from, obj.to);
      value = value && isMonth(obj.month);
      value = value && (isWeekday(obj.weekday) || isHoliday(obj.weekday, feiertage));
      obj.oldValue = obj.hasOwnProperty('value') ? obj.value : undefined;
      obj.value = value;
    }
    return obj;
  }


  async evalTimeAsync(rule) {
    return new Promise((resolve, reject) => {
      // if (!rule) return null;
      if (rule) {
        for (let i in rule.time) {
          let obj = rule.time[i];
          if (!obj.hasOwnProperty('name')) reject('Missing parmater name in section time of ' + rule.rulename);
        }
        this.adapter.log.debug('Staring evalTime with rule: ' + JSON.stringify(rule));
        for (let i in rule.time) {
          let obj = rule.time[i];
          obj = this.inTime(rule.rulename, obj, this.feiertage);
          rule.time[i] = obj;
        }
        resolve(rule);
      } else {
        resolve(rule);
      }
    });
  }

  async evalStatesAsync(rule) {
    return new Promise((resolve, reject) => {
      if (rule) {
        for (let i in rule.state) {
          let obj = rule.state[i];
          if (!obj.hasOwnProperty('name')) reject('Missing parameter name in section state in ' + rule.rulename);
          if (!obj.hasOwnProperty('id')) reject('Missing parameter id in section state of ' + rule.rulename + ' in ' + obj.name);
        }
        this.adapter.log.debug('Staring evalStates with rule: ' + JSON.stringify(rule));
        try {
          getStatesByObjectArray(this.adapter, rule.state, (err, states) => {
            if (err) {
              reject(err);
            } else {
              rule.state = states;
              resolve(rule);
            }
          });
        } catch (e) {
          let err = 'Error in getStatesByObjectArray / Promise (' + rule.rulename + ')';
          // this.adapter.log.error(err);
          reject(err);
        }
      } else {
        resolve(rule);
      }
    });
  }

  async evalTimeStatesAsync(rule) {
    if (rule) {
      this.adapter.log.debug('Staring evalTimeStates with rule: ' + JSON.stringify(rule));
      // rule = this.evalTime(rule);
      try {
        rule = await this.evalTimeAsync(rule);
        rule = await this.evalStatesAsync(rule);
        return rule;
      } catch (err) {
        throw (err);
      }
    } else {
      return rule;
    }
  }

  async evalRulesAsync(rule) {
    return new Promise((resolve, reject) => {
      if (rule) {
        this.adapter.log.debug('Staring evalRules with rule: ' + JSON.stringify(rule));
        let found = null;
        let sandbox = copyObject(buildEvalObjects([rule.time, rule.state]));
        //vm.createContext(sandbox);
        for (let i in rule.rule) {
          let obj = rule.rule[i];
          if (!obj.hasOwnProperty('name')) reject('Missing parameter name in section rule of ' + rule.rulename);
          if (!obj.hasOwnProperty('query')) reject('Missing parameter query in section rule of  ' + rule.rulename + ' in ' + obj.name);
          if (!obj.hasOwnProperty('id')) reject('Missing parameter id in section rule of ' + rule.rulename + ' in ' + obj.name);
          if (!obj.hasOwnProperty('value')) reject('Missing parameter value in section rule of  ' + rule.rulename + ' in ' + obj.name);
          let code = obj.name + ' = ' + obj.query + ';';
          try {
            vm.runInNewContext(code, sandbox);
          } catch (e) {
            let err = 'Error in vm.runInNewContext (' + rule.rulename + ' in Regel ' + obj.name + ')';
            // this.adapter.log.error(err);
            reject(err);
          }
          this.adapter.log.debug('Sandbox: ' + JSON.stringify(sandbox));
          this.adapter.log.debug('Code: ' + code);
          if (!found && sandbox.hasOwnProperty(obj.name) && sandbox[obj.name] == true) {
            rule.oldRegel = rule.regel;
            rule.regel = obj.name;
            rule.oldValue = rule.value;
            rule.value = obj.value;
            rule.id = obj.id;
            rule.callback = obj.callback;
            found = true;
            this.adapter.log.debug('Found: ' + JSON.stringify(rule));
          }
        }
        this.adapter.log.debug('Rule: ' + JSON.stringify(rule));
        resolve(rule);
      } else {
        resolve(rule);
      }
    });
  }

  async executeRuleAsync(rule) {
    try {
      let ruleCopy = copyObject(rule);
      let ruleCopyTimes = await this.evalTimeStatesAsync(ruleCopy);
      let ruleCopyRules = await this.evalRulesAsync(ruleCopyTimes);
      if (ruleCopyRules && ruleCopyRules.regel) {
        let delaytime = ruleCopyRules.rule.find((x) => x.name === ruleCopyRules.regel);
        delaytime = delaytime ? delaytime.delay : undefined;
        let delay = this.times.delayCalc(ruleCopyRules.rulename, ruleCopyRules.regel, delaytime);
        delaytime = this.times.getDelayCalcTime(ruleCopyRules.rulename, ruleCopyRules.regel);
        if ((ruleCopyRules.oldRegel != ruleCopyRules.regel || ruleCopyRules.oldValue != ruleCopyRules.value) && delay) {
          rule.oldRegel = ruleCopyRules.oldRegel;
          rule.regel = ruleCopyRules.regel;
          rule.oldValue = ruleCopyRules.oldValue;
          rule.value = ruleCopyRules.value;
          if (!this.simulation) {
            // Set Sate
            if (ruleCopyRules.id && ruleCopyRules.value !== undefined && ruleCopyRules.value !== null) {
              let deviceid = this.adapter.namespace + '.rules';
              let channelid = deviceid + '.' + rule.rulename.replace(/[^0-9a-zA-Z]/g, '');
              let stateid = channelid + '.rule';
              let ids = (typeof ruleCopyRules.id === 'object') ? ruleCopyRules.id : [ruleCopyRules.id];
              for (let id in ids) {
                let stateId = ids[id];
                this.adapter.log.debug('Changing value for Id: ' + stateId + ' in rule ' + ruleCopyRules.rulename);
                await this.adapter.setForeignStateAsync(stateId, { val: ruleCopyRules.value, ack: false });
              }
              // this.adapter.log.info('Changing value for Id: ' + ruleCopyRules.id + ' in rule ' + ruleCopyRules.rulename);
              // await this.adapter.setForeignStateAsync(ruleCopyRules.id, ruleCopyRules.value);
              delaytime = delaytime ? ' with delay time at ' + delaytime + '' : '';
              if (typeof ruleCopyRules.oldRegel !== 'undefined') {
                this.adapter.log.info(ruleCopyRules.rulename + ', old rule ' + ruleCopyRules.oldRegel + ', new rule ' + ruleCopyRules.regel + ', from old value ' + ruleCopyRules.oldValue + ' to new value ' + ruleCopyRules.value + delaytime + '.');
              } else {
                this.adapter.log.info(ruleCopyRules.rulename + ', rule ' + ruleCopyRules.regel + ' to value ' + ruleCopyRules.value + delaytime + '.');
              }
              await this.adapter.setForeignStateAsync(stateid, { val: ruleCopyRules.regel, ack: true });
              // stateid = channelid + '.ruleset';
              // await this.adapter.setForeignStateAsync(stateid, JSON.stringify(rule));
              stateid = channelid + '.value';
              if (typeof ruleCopyRules.value !== undefined) {
                let obj = await this.adapter.getObjectAsync(stateid);
                if (obj && obj.common && obj.common.type !== typeof ruleCopyRules.value) {
                  await this.adapter.setObjectAsync(stateid, {
                    type: 'state',
                    common: {
                      name: 'Value',
                      type: typeof ruleCopyRules.value,
                      role: 'value',
                      read: true,
                      write: false
                    }
                  });
                }
                await this.adapter.setForeignStateAsync(stateid, { val: ruleCopyRules.value, ack: true });
              }
              stateid = channelid + '.id';
              await this.adapter.setForeignStateAsync(stateid, { val: JSON.stringify(ruleCopyRules.id), ack: true });
              return ruleCopyRules;
            } else {
              // this.adapter.log.info(ruleCopyRules.rulename + ', old rule ' + ruleCopyRules.oldRegel + ', new rule ' + ruleCopyRules.regel + ', from old value ' + ruleCopyRules.oldValue + ' to new value ' + ruleCopyRules.value + '. ID is missing for setting value.');
              return ruleCopyRules;
            }
          } else {
            this.adapter.log.info('Simulation ' + ruleCopyRules.rulename + ', old rule ' + ruleCopyRules.oldRegel + ', new rule ' + ruleCopyRules.regel + ', from old value ' + ruleCopyRules.oldValue + ' to new value ' + ruleCopyRules.value);
          }
        }
      }
    } catch (err) {
      throw (err);
    }
  }

  async executeRulesAsync(rule) {
    try {
      if (rule.active) {
        await this.executeRuleAsync(rule);
      }
      let deviceid = this.adapter.namespace + '.rules';
      let channelid = deviceid + '.' + rule.rulename.replace(/[^0-9a-zA-Z]/g, '');
      let stateid = channelid + '.active';
      let state;
      state = await this.adapter.getForeignStateAsync(stateid);
      if (!state || state.val !== rule.active) {
        await this.adapter.setForeignStateAsync(stateid, { val: rule.active, ack: true });
      }
      stateid = channelid + '.ruleset';
      state = await this.adapter.getForeignStateAsync(stateid);
      if (!state || state.val !== JSON.stringify(rule)) {
        await this.adapter.setForeignStateAsync(stateid, { val: JSON.stringify(rule), ack: true });
      }
    } catch (err) {
      throw (err);
    }
  }

  async executeAllRulesAsync() {
    try {
      for (let i in this.ruleset) {
        let rule = this.ruleset[i];
        await this.executeRulesAsync(rule);
      }
    } catch (err) {
      throw (err);
    }
  }

}

module.exports = {
  'RulesControlerAsync': RulesControlerAsync
};