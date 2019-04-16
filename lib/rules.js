/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';

const vm = require('vm');
const SunCalc = require('suncalc');

// **************************************************************************
// Formatiert  'hh:mm', 'h:m' oder 'h:m:s' in  'hh:mm:ss' zurückgeben
// **************************************************************************
function formatTimeStr(t) {
  if (!t) { t = '00:00:00'; }
  let sign = '';
  if (t.charAt(0) == '-') {
    sign = '-';
    t = t.substr(1);
  }
  if (t.charAt(0) == '+') {
    sign = '';
    t = t.substr(1);
  }
  let d = new Date(Date.parse('01.11.1900 ' + t));
  return sign + dateToTimeStr(d);
}

// **************************************************************************
// Prüft ob es ich um eine Uhrzeit handelt
// **************************************************************************
function isTimeValid(t) {
  let d = new Date(Date.parse('01.11.1900 ' + t));
  if (isNaN(d.getTime())) {
    return false;
  } else {
    return true;
  }
}

// **************************************************************************
// Uhrzeit von Datum in Format 'hh:mm:ss' zurückgeben
// **************************************************************************
function dateToTimeStr(d) {
  d = d ? d : new Date();
  return ((d.getHours() < 10 ? '0' + d.getHours() : + d.getHours()) + ':' +
    (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()) + ':' +
    (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds())).toString();
}

// **************************************************************************
// Uhrzeit + Differenz. Bsp. 10:11:00 + 01:09:00 = 11:20:00
// **************************************************************************
function timePlusTime(t1, t2) {
  t1 = formatTimeStr(t1);
  t2 = formatTimeStr(t2);
  let pm = 1;
  if (t2 && t2.charAt(0) == '-') {
    t2 = t2.substr(1);
    pm = -1;
  }
  let d1 = new Date(Date.parse('01.11.1900 ' + t1));
  let d2 = new Date(Date.parse('01.11.1900 ' + t2));
  let dif = new Date();
  dif.getHours(dif.setHours(d1.getHours() + pm * d2.getHours()));
  dif.getMinutes(dif.setMinutes(d1.getMinutes() + pm * d2.getMinutes()));
  dif.getSeconds(dif.setSeconds(d1.getSeconds() + pm * d2.getSeconds()));
  return dateToTimeStr(dif);
}

// **************************************************************************
// Zeit in 00:00:15 => dann Radnom zwischen 00:00:00 und 00:00:15 
// Zeit in 00:15:10 => dann Radnom zwischen 00:00:00 und 00:15:10
// **************************************************************************
function getRandomTime(t) {
  t = formatTimeStr(t);
  let sign = '';
  if (t && t.charAt(0) == '-') {
    t = t.substr(1);
    sign = '-';
  }
  let d = new Date(Date.parse('01.11.1900 ' + t));
  let z = d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds();
  let r = Math.floor(Math.random() * z);
  let dr = new Date(1 * d - (r * 1000));
  return sign + dateToTimeStr(dr);
}

// **************************************************************************
// Zeit in 00:00:15 => dann Radnom zwischen 00:00:00 und 00:00:15 
// Zeit in 00:15:10 => dann Radnom zwischen 00:00:00 und 00:15:10
// **************************************************************************
function getRandom2(name, t) {
  if (t) {
    if (!name) { name = 'random'; }
    t = formatTimeStr(t);
    let d = new Date();
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // ohne Uhrzeit 
    d = d.toString();
    if (getRandom.rand === undefined) { getRandom.rand = {}; }
    if (!getRandom.rand[name] || t != getRandom.rand[name].t || getRandom.rand[name].d != d) {
      getRandom.rand[name] = {
        t: t,
        r: getRandomTime(t),
        d: d
      };
    }
    return getRandom.rand[name].r;
  } else {
    return t;
  }
}

// **************************************************************************
// Zeit in 00:00:15 => dann Radnom zwischen 00:00:00 und 00:00:15 
// Zeit in 00:15:10 => dann Radnom zwischen 00:00:00 und 00:15:10
// **************************************************************************
function getRandom(name, t) {
  if (!name) { name = 'random'; }
  t = formatTimeStr(t);
  let d = new Date();
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // ohne Uhrzeit
  d = d.toString();
  if (getRandom.rand === undefined) { getRandom.rand = {}; }
  if (!getRandom.rand[name] || t != getRandom.rand[name].t || getRandom.rand[name].d != d) {
    getRandom.rand[name] = {
      t: t,
      r: getRandomTime(t),
      d: d
    };
  }
  return getRandom.rand[name].r;
}

// **************************************************************************
// gibt Zeit zurück 
//  ('07:00', '06:00,08:00') => '07:00'
//  ('07:00', '07:40,08:00') => null
//  ('09:00', '08:40,08:00') => null
// **************************************************************************
function getTimeInMaxMinRange(latitude, longitude, t, range) {
  let rmin = '00:00:00';
  let rmax = '00:00:00';
  if (range) {
    let rgtmp = range.split(',');
    rmin = rgtmp[0];
    rmax = rgtmp[1];
    rmin = checkSuncalc(latitude, longitude, rmin);
    rmax = checkSuncalc(latitude, longitude, rmax);
  }
  if (t) {
    t = formatTimeStr(t);
    rmin = formatTimeStr(rmin);
    rmax = formatTimeStr(rmax);
    if (rmin == '00:00:00' && rmax == '00:00:00') return true; // return t; // Immer in Range
    if (rmin <= t && rmax >= t) return true;  // return t;
    return false; // return null;
    /*
    if (rmin > rmax) return null;
    if (rmin > t) return rmin;
    if (rmax < t) return rmax;
    */
  }
  return false; // return t;
}

// **************************************************************************
// Uhrzeit +/- Randomzeit . Bsp. 10:11:00,00:09:00 = 11:16:22
// Uhrzeit +/- Randomzeit . Bsp. 10:11:00,-00:09:00 = 11:06:02
// **************************************************************************
function timePlusRandomTime(name, t1, t2) {
  t1 = formatTimeStr(t1);
  t2 = formatTimeStr(t2);
  let sign = '';
  if (t2 && t2.charAt(0) == '-') {
    t2 = t2.substr(1);
    sign = '-';
  }
  if (t2 && t2.charAt(0) == '+') {
    t2 = t2.substr(1);
    sign = '';
  }
  t2 = sign + getRandom(name, t2);
  return timePlusTime(t1, t2);
}

// **************************************************************************
// Get radom time between Range. ('time', '06:00:00,06:30:00') => '06:11:27'
// **************************************************************************
/*
function getTimeFromRange(name, t, latitude, longitude) {
    let r = t.split(',');
    if (r.length == 2) {
        let t1 = r[0];
        let t2 = r[1];
        t1 = checkSuncalc(latitude, longitude, t1);
        t2 = checkSuncalc(latitude, longitude, t2);
        if (t1 > t2) return null;
        if (t1 == t2) return t1;
        let rt = timePlusTime(t2, '-' + t1);
        rt = getRandom(name, rt);
        rt = timePlusTime(t1, rt);
        return rt;
    } else {
        return t;
    }
}
*/
function getTimeFromRange(obj) {
  let name = obj.name;
  let t = obj.time;
  let latitude = obj.latitude;
  let longitude = obj.longitude;
  let ttmp = t.split(',');
  if (ttmp.length == 2) {
    let t1 = ttmp[0];
    let t2 = ttmp[1];
    t1 = checkSuncalc(latitude, longitude, t1);
    // t1 = getTimeInMaxMinRange(latitude, longitude, t1, range);
    t2 = checkSuncalc(latitude, longitude, t2);
    // t2 = getTimeInMaxMinRange(latitude, longitude, t2, range);
    if (!t1 || !t2 || t1 > t2) return null;
    if (t1 == t2) return t1;
    let rt = timePlusTime(t2, '-' + t1);
    rt = getRandom(name, rt);
    rt = timePlusTime(t1, rt);
    return rt;
  } else {
    t = checkSuncalc(latitude, longitude, t);
    // t = getTimeInMaxMinRange(latitude, longitude, t, range);
    return t;
  }
}

// **************************************************************************
// actual month in '10,11,1,2' 
// **************************************************************************
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

// **************************************************************************
// Sind 2 Werte gleich, egal welcher Typ
// **************************************************************************
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
 * Gibt den heutigen Wochentag zurück
 */
function getWochentag() {
  let d = new Date();
  let weekday = new Array(7);
  weekday[0] = 'So';
  weekday[1] = 'Mo';
  weekday[2] = 'Di';
  weekday[3] = 'Mi';
  weekday[4] = 'Do';
  weekday[5] = 'Fr';
  weekday[6] = 'Sa';
  return weekday[d.getDay()];
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
 * @param {string} wochentag 
 * @param {string} feiertage 
 */
function isHoliday(wochentag, feiertage) {
  if (!feiertage || !wochentag) return false;
  let tmp = wochentag.toString().trim().replace(/(\r\n|\n|\r|\t|\s)/g, '');
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

// **************************************************************************
// Prüft ob der heutige Tag z.B. Di im String 'Mo,Di,...' erhalten ist
// **************************************************************************
function isWochentag(wochentag) {
  if (typeof wochentag == 'undefined' || wochentag === '') { return true; }
  let tmp = wochentag.toString().trim().replace(/(\r\n|\n|\r|\t|\s)/g, '');
  let wtag = tmp.split(',');
  let today = getWochentag();
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

// **************************************************************************
// current time in format 'hh:mm:ss' between start and ende time
// **************************************************************************
function compareTime(start, ende) {
  if (start && ende) {
    let now = dateToTimeStr();
    now = formatTimeStr(now);
    start = formatTimeStr(start);
    ende = formatTimeStr(ende);
    if (start == '00:00:00' && ende == '00:00:00') {
      return true;
    }
    // z.B. von 6:00 bis 6:00, ausnahme von 0:00 bis 0:00
    if (start >= ende) {
      return false;
    }
    return (now >= start && now <= ende);
  } else {
    return false;
  }
}

// **************************************************************************
// 
// **************************************************************************
function getTimeFromSunCalc(latitude, longitude, name) {
  let sunCalcTime = SunCalc.getTimes(new Date(), latitude, longitude);
  return dateToTimeStr(sunCalcTime[name]);
}
// **************************************************************************
//  sunrise, sunrise+02:00, sunrise-03:03
// **************************************************************************
function checkSuncalc(latitude, longitude, t) {
  if (latitude && longitude && t) {
    const regex = /([a-z]+)(([+-])([\d:]+))*/gm;
    let m = regex.exec(t);
    if (m && m.length == 5) {
      let t1 = getTimeFromSunCalc(latitude, longitude, m[1]);
      let t2 = m[3] + m[4];
      return timePlusTime(t1, t2);
    } else {
      return t;
    }
  }
  return t;
}

// **************************************************************************
// is curent time in object
// obj = { name: 't2', from: '19:00', to: '23:00', weekday: 'Fr,Sa' }
// **************************************************************************
function inTime(rulename, obj, feiertage, latitude, longitude) {
  if (obj) {
    let name = rulename + '_' + obj.name;
    if (obj.duration) {
      obj.duration = getTimeFromRange({
        name: name + '_duration',
        time: obj.duration,
        latitude: latitude,
        longitude: longitude
      });
    }
    if (obj.from) {
      obj.from = getTimeFromRange({
        name: name + '_from',
        time: obj.from,
        range: obj.rangefrom,
        latitude: latitude,
        longitude: longitude
      });
    }
    if (obj.to) {
      obj.to = getTimeFromRange({
        name: name + '_to',
        time: obj.to,
        range: obj.rangeto,
        latitude: latitude,
        longitude: longitude
      });
    }
    if (!obj.from && obj.to && obj.duration) {
      obj.from = timePlusTime(obj.to, obj.duration);
      // obj.from = getTimeInMaxMinRange(latitude, longitude, obj.from, obj.range);
    }
    if (obj.from && !obj.to && obj.duration) {
      obj.to = timePlusTime(obj.from, obj.duration);
      // obj.to = getTimeInMaxMinRange(latitude, longitude, obj.to, obj.range);
    }
    // if (!obj.from) { obj.from = '00:00:00'; }
    // if (!obj.to) { obj.to = '00:00:00'; }
    if (!obj.weekday) { obj.weekday = ''; }
    let value = getTimeInMaxMinRange(latitude, longitude, obj.from, obj.range) && getTimeInMaxMinRange(latitude, longitude, obj.to, obj.range);
    value = value && compareTime(obj.from, obj.to);
    value = value && isMonth(obj.month);
    value = value && (isWochentag(obj.weekday) || isHoliday(obj.weekday, feiertage));
    obj.oldValue = obj.hasOwnProperty('value') ? obj.value : undefined;
    obj.value = value;
  }
  return obj;
}

// *****************************************************************************************************
// Read Status for an Array of ID as Promisse All
// *****************************************************************************************************
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
  }).catch((reason) => {
    callback && callback('Error in getStatesByArray in function Promise.All');
  });
}

// *****************************************************************************************************
// 
// *****************************************************************************************************
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

// *****************************************************************************************************
// Copy form input obj only the fields name, value and oldValue
// *****************************************************************************************************
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

// *****************************************************************************************************
// Objekte kopieren
// *****************************************************************************************************
function copyObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// *****************************************************************************************************
// Controler Async
// *****************************************************************************************************
class RulesControlerAsync {

  constructor(adapter) {
    this.adapter = adapter;
    this.simulation = adapter.config.simulation || false;
    this.ruleset = [];
    this.feiertage = [];
    this.latitude;
    this.longitude;
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
  async addRules(ruleset) {
    if (ruleset) {
      this.adapter.log.debug('Staring addRules with rule: ' + JSON.stringify(ruleset));
      for (let i in ruleset) {
        this.addRule(ruleset[i]);
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
        id = channelid + '.value';
        await this.adapter.setObjectNotExistsAsync(id, {
          type: 'state',
          common: {
            name: 'Value',
            type: 'string',
            role: 'value',
            read: true,
            write: false
          }
        });
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
          obj = inTime(rule.rulename, obj, this.feiertage, this.latitude, this.longitude);
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
      if (ruleCopyRules) {
        rule.oldRegel = ruleCopyRules.oldRegel;
        rule.regel = ruleCopyRules.regel;
        rule.oldValue = ruleCopyRules.oldValue;
        rule.value = ruleCopyRules.value;
        if (ruleCopyRules.oldRegel != ruleCopyRules.regel || ruleCopyRules.oldValue != ruleCopyRules.value) {
          if (!this.simulation) {
            // Set Sate
            if (ruleCopyRules.id) {
              let deviceid = this.adapter.namespace + '.rules';
              let channelid = deviceid + '.' + rule.rulename.replace(/[^0-9a-zA-Z]/g, '');
              let stateid = channelid + '.rule';
              let ids = (typeof ruleCopyRules.id === 'object') ? ruleCopyRules.id : [ruleCopyRules.id];
              for (let id in ids) {
                let stateId = ids[id];
                this.adapter.log.debug('Changing value for Id: ' + stateId + ' in rule ' + ruleCopyRules.rulename);
                await this.adapter.setForeignStateAsync(stateId, ruleCopyRules.value);
              }
              // this.adapter.log.info('Changing value for Id: ' + ruleCopyRules.id + ' in rule ' + ruleCopyRules.rulename);
              // await this.adapter.setForeignStateAsync(ruleCopyRules.id, ruleCopyRules.value);
              this.adapter.log.info(ruleCopyRules.rulename + ', alte Regel ' + ruleCopyRules.oldRegel + ', neue Regel ' + ruleCopyRules.regel + ', von altem Wert ' + ruleCopyRules.oldValue + ' auf neuen Wert ' + ruleCopyRules.value + '.');
              await this.adapter.setForeignStateAsync(stateid, ruleCopyRules.regel);
              // stateid = channelid + '.ruleset';
              // await this.adapter.setForeignStateAsync(stateid, JSON.stringify(rule));
              stateid = channelid + '.value';
              await this.adapter.setForeignStateAsync(stateid, ruleCopyRules.value);
              stateid = channelid + '.id';
              await this.adapter.setForeignStateAsync(stateid, JSON.stringify(ruleCopyRules.id));
              return ruleCopyRules;
            } else {
              this.adapter.log.info(ruleCopyRules.rulename + ', alte Regel ' + ruleCopyRules.oldRegel + ', neue Regel ' + ruleCopyRules.regel + ', von altem Wert ' + ruleCopyRules.oldValue + ' auf neuen Wert ' + ruleCopyRules.value + '. Id nicht gesetzt.');
              return ruleCopyRules;
            }
          } else {
            this.adapter.log.info('Simulation ' + ruleCopyRules.rulename + ', alte Regel ' + ruleCopyRules.oldRegel + ', neue Regel ' + ruleCopyRules.regel + ', von altem Wert ' + ruleCopyRules.oldValue + ' auf neuen Wert ' + ruleCopyRules.value);
            if (ruleCopyRules.callback) {
              ruleCopyRules.callback(ruleCopyRules.value);
            }
          }
        }
      }
    } catch (err) {
      throw (err);
    }
  }

  async executeRulesAsync() {
    try {
      for (let i in this.ruleset) {
        let rule = this.ruleset[i];
        if (rule.active) {
          await this.executeRuleAsync(rule);
        }
        let deviceid = this.adapter.namespace + '.rules';
        let channelid = deviceid + '.' + rule.rulename.replace(/[^0-9a-zA-Z]/g, '');
        let stateid = channelid + '.active';
        let state;
        state = await this.adapter.getForeignStateAsync(stateid);
        if (!state || state.val !== rule.active) {
          await this.adapter.setForeignStateAsync(stateid, rule.active);
        }
        stateid = channelid + '.ruleset';
        state = await this.adapter.getForeignStateAsync(stateid);
        if (!state || state.val !== JSON.stringify(rule)) {
          await this.adapter.setForeignStateAsync(stateid, JSON.stringify(rule));
        }
      }
    } catch (err) {
      throw (err);
    }
  }

}

module.exports = {
  'RulesControlerAsync': RulesControlerAsync
};