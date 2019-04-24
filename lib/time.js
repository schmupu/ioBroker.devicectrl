/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';

const SunCalc = require('suncalc');

class Time {

  constructor(obj) {
    this.adapter = obj.adapter;
    this.longitude = obj.longitude;
    this.latitude = obj.latitude;
    this.randomtimes = {};
    this.delay = {};
  }

  /**
  * Uhrzeit vom Objekt Datum in Format 'hh:mm:ss' zurückgeben
  * @param {date} Datum vom Typ new Date
  */
  dateToTimeStr(d) {
    d = d ? d : new Date();
    return ((d.getHours() < 10 ? '0' + d.getHours() : + d.getHours()) + ':' +
      (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()) + ':' +
      (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds())).toString();
  }

  /**
  * Formatiert  'hh:mm', 'h:m' oder 'h:m:s' in  'hh:mm:ss' zurückgeben
  * @param {string} : Time in String format 
  */
  formatTimeStr(t) {
    if (!t || t.length == 0) { t = '00:00:00'; }
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
    return sign + this.dateToTimeStr(d);
  }

  getTimeFromSunCalc(name) {
    let sunCalcTime = SunCalc.getTimes(new Date(), this.latitude, this.longitude);
    return this.dateToTimeStr(sunCalcTime[name]);
  }

  getSignFromTime(t) {
    if (t && t.charAt(0) == '-') {
      t = t.substr(1);
      return -1;
    } else {
      return 1;
    }
  }

  getTimeWithoutSign(t) {
    if (t && t.charAt(0) == '-') {
      t = t.substr(1);
    }
    return t;
  }

  /**
   * current time in format 'hh:mm:ss' between start and ende time
   * @param {*} start 
   * @param {*} ende 
   */
  compareTime(start, ende) {
    if (start && ende) {
      let now = this.dateToTimeStr();
      now = this.formatTimeStr(now);
      start = this.formatTimeStr(start);
      ende = this.formatTimeStr(ende);
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

  /**
   * Uhrzeit + Differenz. Bsp. 10:11:00 + 01:09:00 = 11:20:00
   * @param {*} t1 
   * @param {*} t2 
   */
  timePlusTime(t1, t2) {
    t1 = this.formatTimeStr(t1);
    t2 = this.formatTimeStr(t2);
    let pm = this.getSignFromTime(t2);
    t2 = this.getTimeWithoutSign(t2);
    let d1 = new Date(Date.parse('01.11.1900 ' + t1));
    let d2 = new Date(Date.parse('01.11.1900 ' + t2));
    let dif = new Date();
    dif.getHours(dif.setHours(d1.getHours() + pm * d2.getHours()));
    dif.getMinutes(dif.setMinutes(d1.getMinutes() + pm * d2.getMinutes()));
    dif.getSeconds(dif.setSeconds(d1.getSeconds() + pm * d2.getSeconds()));
    return this.dateToTimeStr(dif);
  }

  /**
   * Zeit in 00:00:15 => dann Radnom zwischen 00:00:00 und 00:00:15 
   * Zeit in 00:15:10 => dann Radnom zwischen 00:00:00 und 00:15:10
   * @param {*} t 
   */
  getRandomTime(t) {
    t = this.formatTimeStr(t);
    let sign = '';
    if (t && t.charAt(0) == '-') {
      t = t.substr(1);
      sign = '-';
    }
    let d = new Date(Date.parse('01.11.1900 ' + t));
    let z = d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds();
    let r = Math.floor(Math.random() * z);
    let dr = new Date(1 * d - (r * 1000));
    return sign + this.dateToTimeStr(dr);
  }

  /**
   * Zeit in 00:00:15 => dann Radnom zwischen 00:00:00 und 00:00:15 
   * Zeit in 00:15:10 => dann Radnom zwischen 00:00:00 und 00:15:10
   * @param {*} name 
   * @param {*} t 
   */
  getRandom(name, t) {
    if (!name) { name = 'random'; }
    t = this.formatTimeStr(t);
    let d = new Date();
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // ohne Uhrzeit
    d = d.toString();
    if (!this.randomtimes[name] || t != this.randomtimes[name].t || this.randomtimes[name].d != d) {
      this.randomtimes[name] = {
        t: t,
        r: this.getRandomTime(t),
        d: d
      };
    }
    return this.randomtimes[name].r;
  }

  /**
   * Is time in t in time range
   *  ('07:00', '06:00,08:00') => true
   *  ('07:00', '07:40,08:00') => false
   *  ('09:00', '08:40,08:00') => false
   * @param {*} latitude 
   * @param {*} longitude 
   * @param {*} t 
   * @param {*} range 
   */
  getTimeInMaxMinRange(t, range) {
    let rmin = '00:00:00';
    let rmax = '00:00:00';
    if (range) {
      let rgtmp = range.split(',');
      rmin = rgtmp[0];
      rmax = rgtmp[1];
      rmin = this.checkSuncalc(rmin);
      rmax = this.checkSuncalc(rmax);
    }
    if (t) {
      t = this.formatTimeStr(t);
      rmin = this.formatTimeStr(rmin);
      rmax = this.formatTimeStr(rmax);
      if (rmin == '00:00:00' && rmax == '00:00:00') return true;
      if (rmin <= t && rmax >= t) return true;
      return false;
    }
    return false;
  }

  /**
   * Uhrzeit +/- Randomzeit . Bsp. 10:11:00,00:09:00 = 11:16:22
   * Uhrzeit +/- Randomzeit . Bsp. 10:11:00,-00:09:00 = 11:06:02
   * @param {*} name 
   * @param {*} t1 
   * @param {*} t2 
   */
  timePlusRandomTime(name, t1, t2) {
    t1 = this.formatTimeStr(t1);
    t2 = this.formatTimeStr(t2);
    let sign = '';
    if (t2 && t2.charAt(0) == '-') {
      t2 = t2.substr(1);
      sign = '-';
    }
    if (t2 && t2.charAt(0) == '+') {
      t2 = t2.substr(1);
      sign = '';
    }
    t2 = sign + this.getRandom(name, t2);
    return this.timePlusTime(t1, t2);
  }

  /**
   * sunrise, sunrise+02:00, sunrise-03:03
   * @param {*} latitude 
   * @param {*} longitude 
   * @param {*} t 
   */
  checkSuncalc(t) {
    if (this.latitude && this.longitude && t) {
      const regex = /([a-z]+)(([+-])([\d:]+))*/gm;
      let m = regex.exec(t);
      if (m && m.length == 5) {
        let t1 = this.getTimeFromSunCalc(m[1]);
        let t2 = m[3] + m[4];
        return this.timePlusTime(t1, t2);
      } else {
        return t;
      }
    }
    return t;
  }

  /**
  * Get radom time between Range. 'time', '06:00:00,06:30:00' => '06:11:27'
  * @param {*} obj 
  */
  getTimeFromRange(name, t) {
    let ttmp = t.split(',');
    if (ttmp.length == 2) {
      let t1 = ttmp[0];
      let t2 = ttmp[1];
      t1 = this.checkSuncalc(t1);
      t2 = this.checkSuncalc(t2);
      if (!t1 || !t2 || t1 > t2) return null;
      if (t1 == t2) return t1;
      let rt = this.timePlusTime(t2, '-' + t1);
      rt = this.getRandom(name, rt);
      rt = this.timePlusTime(t1, rt);
      return rt;
    } else {
      t = this.checkSuncalc(t);
      return t;
    }
  }

  delayCalc(rulename, rule, value) {
    if (!this.delay[rulename]) {
      this.delay[rulename] = {};
    }
    if (!this.delay[rulename][rule]) {
      this.delay[rulename] = {};
      if (value === undefined || value === null || rule == undefined) {
        return true;
      } else {
        let rgtmp = value.split(',');
        let now = this.dateToTimeStr();
        now = this.formatTimeStr(now);
        if (rgtmp.length === 2) {
          value = this.timePlusTime(rgtmp[1], '-' + rgtmp[0]);
          value = this.timePlusRandomTime('delay_' + rulename + '_' + rule, now, value);
          value = this.timePlusTime(rgtmp[0], value);
          this.delay[rulename][rule] = value;
        } else {
          this.delay[rulename][rule] = this.timePlusTime(now, value);
        }
      }
    }
    let now = this.dateToTimeStr();
    now = this.formatTimeStr(now);
    return this.delay[rulename][rule] <= now;
  }

  getDelayCalcTime(rulename, rule) {
    if( this.delay[rulename] && this.delay[rulename][rule] ) {
      return this.delay[rulename][rule]; 
    } else {
      return undefined;
    }
  }

}


module.exports = {
  'Time': Time
};