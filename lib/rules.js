var vm = require('vm');
var SunCalc = require('suncalc');


// **************************************************************************
// Formatiert  "hh:mm", "h:m" oder "h:m:s" in  "hh:mm:ss" zurückgeben
// **************************************************************************
function formatTimeStr(t) {
    if (!t) { t = "00:00:00"; }
    let sign = "";
    if (t.charAt(0) == '-') {
        sign = "-";
        t = t.substr(1);
    }
    let d = new Date(Date.parse("01.11.1900 " + t));
    return sign + dateToTimeStr(d);
}

// **************************************************************************
// Uhrzeit von Datum in Format "hh:mm:ss" zurückgeben
// **************************************************************************
function dateToTimeStr(d) {
    if (!d) {
        d = new Date();
    }
    return ((d.getHours() < 10 ? '0' + d.getHours() : + d.getHours()) + ":" +
        (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()) + ":" +
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
    let d1 = new Date(Date.parse("01.11.1900 " + t1));
    let d2 = new Date(Date.parse("01.11.1900 " + t2));
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
    let sign = "";
    if (t && t.charAt(0) == '-') {
        t = t.substr(1);
        sign = "-";
    }
    let d = new Date(Date.parse("01.11.1900 " + t));
    let z = d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds();
    let r = Math.floor(Math.random() * z);
    let dr = new Date(1 * d - (r * 1000));
    return sign + dateToTimeStr(dr);
}

// **************************************************************************
// Uhrzeit +/- Randomzeit . Bsp. 10:11:00,00:09:00 = 11:16:22
// Uhrzeit +/- Randomzeit . Bsp. 10:11:00,-00:09:00 = 11:06:02
// **************************************************************************
function timePlusRandomTime(name, t1, t2) {
    t1 = formatTimeStr(t1);
    t2 = formatTimeStr(t2);
    if (t2 && t2.charAt(0) == '-') {
        t2 = t2.substr(1);
        t2 = '-' + getRandom(name, t2);
    } else {
        t2 = getRandom(name, t2);
    }
    return timePlusTime(t1, t2);
}

// **************************************************************************
// 
// **************************************************************************
function getRandom(name, t) {
    if (!name) { name = "random"; }
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
        }
    }
    return getRandom.rand[name].r;
}

// **************************************************************************
// Get radom time between Range. ("time", "06:00:00,06:30:00") => "06:11:27"
// **************************************************************************
function getTimeFromRange(name, t) {
    let r = t.split(",");
    if (r.length == 2) {
        if (r[0] > r[1]) return null;
        if (r[0] == r[1]) return r[0];
        let rt = timePlusTime(r[1], "-" + r[0]);
        rt = getRandom(name, rt);
        rt = timePlusTime(r[0], rt);
        return rt;
    } else {
        return t;
    }
}


// **************************************************************************
// actual month in "10,11,1,2" 
// **************************************************************************
function isMonth(month) {
    if (!month || month == "") return true;
    let d = new Date();
    let m = 1 * d.getMonth();
    let s = month.split(",");
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
    if (typeof a === "object" && typeof b === "object") {
        // Create arrays of property names
        let aProps = Object.getOwnPropertyNames(a);
        let bProps = Object.getOwnPropertyNames(b);
        // If number of properties is different,
        // objects are not equivalent
        if (aProps.length != bProps.length) {
            return false;
        }
        for (let i = 0; i < aProps.length; i++) {
            var propName = aProps[i];
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

// **************************************************************************
// Gibt den heutigen Wochentag zurück
// **************************************************************************
function getWochentag() {

    var d = new Date();
    var weekday = new Array(7);

    weekday[0] = "So";
    weekday[1] = "Mo";
    weekday[2] = "Di";
    weekday[3] = "Mi";
    weekday[4] = "Do";
    weekday[5] = "Fr";
    weekday[6] = "Sa";

    return weekday[d.getDay()];

}

// **************************************************************************
// ist heute ein Feiertag
// **************************************************************************
function isHoliday(wochentag, feiertage) {

    if (!feiertage || !wochentag) return false;

    let tmp = wochentag.toString().trim().replace(/(\r\n|\n|\r|\t|\s)/g, "");
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
        day = ((day < 10) ? "0" + day : day);
        month = ((month < 10) ? "0" + month : month);
        let datum = year + "-" + month + "-" + day;
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
// Prüft ob der heutige Tag z.B. Di im String "Mo,Di,..." erhalten ist
// **************************************************************************
function isWochentag(wochentag) {

    if (typeof wochentag == "undefined" || wochentag === "") { return true; }

    let tmp = wochentag.toString().trim().replace(/(\r\n|\n|\r|\t|\s)/g, "");
    let wtag = tmp.split(',');
    let now = new Date();
    let today = getWochentag();
    let urlaub = false; // onVacation(); // befinde ich mich im Urlaub

    // Wenn Feiertag oder Urlaub dann tun wir so ob Samstag wäre
    // Hd oder Vc
    if (urlaub === true) {
        today = "Sa";
    }

    for (let i = 0; i < wtag.length; i++) {
        if (wtag[i] == today) {
            return true;
        }
    }
    return false;
}


// **************************************************************************
// Uhrzeit von Datum in Format "hh:mm:ss" zurückgeben
// **************************************************************************
function dateToTimeStr(d) {

    d = d ? d : new Date();

    return ((d.getHours() < 10 ? '0' + d.getHours() : + d.getHours()) + ":" +
        (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()) + ":" +
        (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds())).toString();

}

// **************************************************************************
// convert Time to  "hh:mm:ss" format
// **************************************************************************
function formatTime(time) {

    let t = time ? time + ":00:00" : "00:00:00";
    let s = t.split(":");
    t = "";
    for (let i = 0; i < 3; i++) {
        if (s[i].length == 1) { s[i] = "0" + s[i]; }
        if (i > 0) {
            t += ":" + s[i];
        } else {
            t = s[i];
        }
    }
    return t;
}

// **************************************************************************
// current time in format "hh:mm:ss" between start and ende time
// **************************************************************************
function compareTime(start, ende) {
    let now = dateToTimeStr();
    now = formatTimeStr(now);
    start = formatTimeStr(start);
    ende = formatTimeStr(ende);
    if (start == '00:00:00' && ende == '00:00:00') {
        return true;
    } else {
        return (now >= start && now <= ende);
    }
}


// **************************************************************************
// is curent time in object
// obj = { name: "t2", from: "19:00", to: "23:00", weekday: "Fr,Sa" }
// **************************************************************************
function inTime3(rulename, obj, feiertage, sunCalcTimes) {

    if (!obj.hasOwnProperty("from")) { obj.from = "00:00:00"; }
    if (!obj.hasOwnProperty("to")) { obj.to = "00:00:00"; }
    if (!obj.hasOwnProperty("weekday")) { obj.weekday = ""; }
    if (!obj.hasOwnProperty("callback")) { obj.callback = function () { return true; } }

    let value = compareTime(obj.from, obj.to) && (isWochentag(obj.weekday) || isHoliday(obj.weekday, feiertage)) && obj.callback();
    obj.oldValue = obj.hasOwnProperty("value") ? obj.value : undefined;
    obj.value = value;
    return obj;

}

function getTimeFromSunCalc(latitude, longitude, name) {
    let sunCalcTime = SunCalc.getTimes(new Date(), latitude, longitude);
    return dateToTimeStr(sunCalcTime[name]);
}

// **************************************************************************
// is curent time in object
// obj = { name: "t2", from: "19:00", to: "23:00", weekday: "Fr,Sa" }
// **************************************************************************
function inTime2(rulename, obj, feiertage, latitude, longitude) {

    if (obj) {
        let name = rulename + '_' + obj.name;
        if (obj.from == 'sunrise') {
            obj.from = getTimeFromSunCalc(latitude, longitude, obj.from);
        }
        if (obj.from == 'sunset') { obj.from = getTimeFromSunCalc(latitude, longitude, obj.from); }
        if (obj.to == 'sunrise') { obj.to = getTimeFromSunCalc(latitude, longitude, obj.to); }
        if (obj.to == 'sunset') { obj.to = getTimeFromSunCalc(latitude, longitude, obj.to); }
        if (obj.duration && obj.random_duration) {
            obj.duration = timePlusRandomTime(name + "_duration", obj.duration, obj.random_duration);
        }

        if (obj.to && !obj.from && obj.duration) {
            obj.from = timePlusTime(obj.to, obj.duration);
        }
        if (obj.from && !obj.to && obj.duration) {
            obj.to = timePlusTime(obj.from, obj.duration);
        }

        if (obj.to && obj.random_to) {
            obj.to = timePlusRandomTime(name + "_to", obj.to, obj.random_to);
        }
        if (obj.from && obj.random_from) {
            obj.from = timePlusRandomTime(name + "from", obj.from, obj.random_from);
        }

        if (!obj.from) { obj.from = "00:00:00"; }
        if (!obj.to) { obj.to = "00:00:00"; }
        if (!obj.weekday) { obj.weekday = ""; }
        if (!obj.month) { obj.month = ""; }

        let value = compareTime(obj.from, obj.to) && (isWochentag(obj.weekday) || isHoliday(obj.weekday, feiertage));

        obj.oldValue = obj.hasOwnProperty("value") ? obj.value : undefined;
        obj.value = value;
    }
    return obj;

}

// **************************************************************************
// is curent time in object
// obj = { name: "t2", from: "19:00", to: "23:00", weekday: "Fr,Sa" }
// **************************************************************************
function inTime(rulename, obj, feiertage, latitude, longitude) {

    if (obj) {
        let name = rulename + '_' + obj.name;
        if (obj.from == 'sunrise') {
            obj.from = getTimeFromSunCalc(latitude, longitude, obj.from);
        }
        if (obj.from == 'sunset') {
            obj.from = getTimeFromSunCalc(latitude, longitude, obj.from);
        }
        if (obj.to == 'sunrise') {
            obj.to = getTimeFromSunCalc(latitude, longitude, obj.to);
        }
        if (obj.to == 'sunset') {
            obj.to = getTimeFromSunCalc(latitude, longitude, obj.to);
        }

        if (obj.duration) {
            obj.duration = getTimeFromRange(name + "_duration", obj.duration);
        }

        if (obj.from) {
            obj.from = getTimeFromRange(name + "_from", obj.from);
        }

        if (obj.to) {
            obj.to = getTimeFromRange(name + "_to", obj.to);
        }

        if (obj.to && !obj.from && obj.duration) {
            obj.from = timePlusTime(obj.to, obj.duration);
        }
        if (obj.from && !obj.to && obj.duration) {
            obj.to = timePlusTime(obj.from, obj.duration);
        }

        if (!obj.from) { obj.from = "00:00:00"; }
        if (!obj.to) { obj.to = "00:00:00"; }
        if (!obj.weekday) { obj.weekday = ""; }

        let value = compareTime(obj.from, obj.to) && isMonth(obj.month) && (isWochentag(obj.weekday) || isHoliday(obj.weekday, feiertage));

        obj.oldValue = obj.hasOwnProperty("value") ? obj.value : undefined;
        obj.value = value;
    }
    return obj;

}

// *****************************************************************************************************
// Read Status for an Array of ID as Promisse All
// *****************************************************************************************************
function getStatesByArray(adapter, idAarray, callback) {

    if (!idAarray) return callback && callback("idArray missing in function getStatesByArray");

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

    Promise.all(promisArray).then(values => {
        callback && callback(null, values);
    }).catch(reason => {
        callback && callback("Error in getStatesByArray in function Promise.All");
    });

}

// *****************************************************************************************************
// 
// *****************************************************************************************************
function getStatesByObjectArray(adapter, objArray, callback) {

    if (!objArray) return callback && callback("ObjArray missing in function getStatesByObjectArray");

    let arr = [];
    for (let i in objArray) {
        let obj = objArray[i];
        let id = obj.id || undefined;
        arr.push(id)
    }

    getStatesByArray(adapter, arr, (error, values) => {
        for (let i = 0; i < objArray.length; i++) {
            let val = values[i] ? values[i] : null;
            let obj = objArray[i];
            obj.oldValue = obj.hasOwnProperty("value") ? obj.oldValue = obj.value : obj.oldValue = undefined;
            obj.value = val && val.hasOwnProperty("val") ? val.val : null;
            if (obj.hasOwnProperty("cmpvalue")) {
                obj.value = isEquivalent(obj.value, obj.cmpvalue);
            }
        }
        callback && callback(error, objArray);
    })

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
            if (obj.hasOwnProperty("name") && obj.hasOwnProperty("value")) {
                // result[obj.name] = { value: obj.value, oldValue: obj.oldValue }
                // result[obj.name] = { v: obj.value, ov: obj.oldValue }
                result[obj.name] = obj.value;
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
// Controler
// *****************************************************************************************************
class RulesControler {

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
            this.adapter.log.debug("Staring init with rule: " + JSON.stringify(rule));
            rule.regel = undefined;
            rule.oldRegel = undefined;
            rule.value = undefined;
            rule.oldValue = undefined;
            // if (!rule.hasOwnProperty("regel")) { rule.regel = undefined; };
            // if (!rule.hasOwnProperty("oldRegel")) { rule.oldRegel = undefined; };
            // if (!rule.hasOwnProperty("value")) { rule.value = undefined; };
            // if (!rule.hasOwnProperty("oldValue")) {  rule.oldValue = undefined; };
            if (!rule.hasOwnProperty("time")) { rule.time = {}; }
            if (!rule.hasOwnProperty("state")) { rule.state = {}; }
            if (!rule.hasOwnProperty("rule")) { rule.rule = {}; }
            return rule;
        }
    }

    addRule(rule) {
        if (rule) {
            this.adapter.log.debug("Staring addRule with rule: " + JSON.stringify(rule));
            rule = this.init(copyObject(rule));
            this.ruleset.push(rule);
        }
    }

    addRules(ruleset) {
        if (rulleset) {
            this.adapter.log.debug("Staring addRules with rule: " + JSON.stringify(ruleset));
            for (let i in ruleset) {
                this.addRule(ruleset[i]);
            }
        }
    }

    deleteRule(rulename) {
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
    }

    modifyRule(rule) {
        if (rule) {
            this.adapter.log.debug("Staring modifyRules with rule: " + JSON.stringify(rule));
            let rulename = rule.rulename;
            this.deleteRule(rulename);
            this.addRule(rule);
        }
    }

    modifyRules(ruleset) {
        if (ruleset) {
            this.adapter.log.debug("Staring modifyRules with rule: " + JSON.stringify(ruleset));
            for (let i in ruleset) {
                let rule = ruleset[i];
                this.modifyRule(rule);
            }
        }
    }

    getRules() {
        return this.ruleset;
    }


    setHolidays(feiertage) {
        this.feiertage = feiertage;
    }

    setCoordinates(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    evalTime(rule) {
        if (!rule) return null;
        this.adapter.log.debug("Staring evalTime with rule: " + JSON.stringify(rule));
        for (let i in rule.time) {
            let obj = rule.time[i];
            obj = inTime(rule.rulename, obj, this.feiertage, this.latitude, this.longitude);
            rule.time[i] = obj;
        }
        return rule;
    }


    evalStates(rule, callback) {
        if (!rule) return callback && callback("Rule Missing in evalStates");
        this.adapter.log.debug("Staring evalStates with rule: " + JSON.stringify(rule));
        try {
            getStatesByObjectArray(this.adapter, rule.state, callback);
        } catch (e) {
            let err = 'Error in getStatesByObjectArray / Promise (' + rule.rulename + ')';
            // this.adapter.log.error(err);
            callback && callback(err);
        }
    }

    evalAll(rule, callback) {
        if (!rule) return callback && callback("Rule missing in evalAll");
        this.adapter.log.debug("Staring evalAll with rule: " + JSON.stringify(rule));
        rule = this.evalTime(rule);
        this.evalStates(rule, (err, states) => {
            if (err) {
                callback && callback(err);
            } else {
                rule.state = states;
                callback && callback(err, rule);
            }
        });
    }

    evalQuery(rule, callback) {
        if (!rule) return callback && callback("Rule missing");
        this.adapter.log.debug("Staring evalQuery with rule: " + JSON.stringify(rule));
        let found = null;
        let sandbox = copyObject(buildEvalObjects([rule.time, rule.state]));
        //vm.createContext(sandbox);
        for (let i in rule.rule) {
            let obj = rule.rule[i];
            let code = obj.name + ' = ' + obj.query + ';';
            try {
                vm.runInNewContext(code, sandbox);
            } catch (e) {
                let err = 'Error in vm.runInNewContext (' + rule.rulename + ' in Regel ' + obj.name + ')';
                // this.adapter.log.error(err);
                callback && callback(err);
            }
            this.adapter.log.debug("Sandbox: " + JSON.stringify(sandbox));
            this.adapter.log.debug("Code: " + code);
            if (!found && sandbox.hasOwnProperty(obj.name) && sandbox[obj.name] == true) {
                rule.oldRegel = rule.regel;
                rule.regel = obj.name;
                rule.oldValue = rule.value;
                rule.value = obj.value;
                found = {
                    rulename: rule.rulename,
                    regel: rule.regel,
                    oldRegel: rule.oldRegel,
                    value: rule.value,
                    oldValue: rule.oldValue,
                    id: obj.id,
                    callback: obj.callback
                };
                this.adapter.log.debug("Found: " + JSON.stringify(found));
            }
        }
        this.adapter.log.debug("Rule: " + JSON.stringify(rule));
        callback && callback(null, found);
    }

    executeRule(rule, callback) {
        let ruleCopy = copyObject(rule);
        this.evalAll(ruleCopy, (err, values) => {
            if (err) {
                callback && callback(err, values);
            } else {
                ruleCopy = values;
                this.evalQuery(ruleCopy, (err, val) => {
                    if (err) {
                        callback && callback(err, val);
                    } else {
                        if (val) {
                            rule.oldRegel = val.oldRegel;
                            rule.regel = val.regel;
                            rule.oldValue = val.oldValue;
                            rule.value = val.value;
                            if (val.oldRegel != val.regel || val.oldValue != val.value) {
                                if (!this.simulation) {
                                    // Set Sate
                                    this.adapter.setForeignState(val.id, val.value, err => {
                                        if (!err) {
                                            this.adapter.log.info(val.rulename + ", alte Regel " + val.oldRegel + ", neue Regel " + val.regel + ", von altem Wert " + val.oldValue + " auf neuen Wert " + val.value);
                                            callback && callback(err, val);
                                        } else {
                                            callback && callback(err, val);
                                        }
                                    });
                                } else {
                                    this.adapter.log.info("Simulation " + val.rulename + ", alte Regel " + val.oldRegel + ", neue Regel " + val.regel + ", von altem Wert " + val.oldValue + " auf neuen Wert " + val.value);
                                    if (val.callback) {
                                        val.callback(val.value);
                                    }
                                }
                            }
                        } else {
                            callback && callback(err, val);
                        }
                    }
                });
            }
        });
    }

    executeRules(callback) {
        for (let i in this.ruleset) {
            let rule = this.ruleset[i];
            this.executeRule(rule, callback);
        }
    }


}

module.exports = RulesControler;
