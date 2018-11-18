var vm = require('vm');

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
    now = formatTime(now);
    start = formatTime(start);
    ende = formatTime(ende);
    return (now >= start && now <= ende);
}


// **************************************************************************
// is curent time in object
// obj = { name: "t2", from: "19:00", to: "23:00", weekday: "Fr,Sa" }
// **************************************************************************
function inTime(obj, feiertage) {

    if (!obj.hasOwnProperty("from")) { obj.from = "00:00"; }
    if (!obj.hasOwnProperty("to")) { obj.to = "24:00"; }
    if (!obj.hasOwnProperty("weekday")) { obj.weekday = ""; }
    if (!obj.hasOwnProperty("callback")) { obj.callback = function () { return true; } }

    let value = compareTime(obj.from, obj.to) && (isWochentag(obj.weekday) || isHoliday(obj.weekday, feiertage)) && obj.callback();
    obj.oldValue = obj.hasOwnProperty("value") ? obj.value : undefined;
    obj.value = value;
    return obj;

}

// *****************************************************************************************************
// Read Status for an Array of ID as Promisse All
// *****************************************************************************************************
function getStatesByArray(adapter, idAarray, callback) {

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
        callback && callback(values);
    }).catch(reason => {
        callback && callback(null);
    });

}

// *****************************************************************************************************
// 
// *****************************************************************************************************
function getStatesByObjectArray(adapter, objArray, callback) {

    let arr = [];
    for (let i in objArray) {
        let obj = objArray[i];
        let id = obj.id || undefined;
        arr.push(id)
    }

    getStatesByArray(adapter, arr, (values) => {
        for (let i = 0; i < objArray.length; i++) {
            let val = values[i] ? values[i] : null;
            let obj = objArray[i];
            obj.oldValue = obj.hasOwnProperty("value") ? obj.oldValue = obj.value : obj.oldValue = undefined;
            obj.value = val && val.hasOwnProperty("val") ? val.val : null;
            if (obj.hasOwnProperty("cmpvalue")) {
                obj.value = isEquivalent(obj.value, obj.cmpvalue);
            }
        }
        callback && callback(objArray);
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

    constructor(adapter, polltime) {
        this.adapter = adapter;
        this.polltime = polltime || 15;
        this.ruleset = [];
        this.feiertage = [];
    }

    init(rule) {
        if (rule) {
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
            rule = this.init(copyObject(rule));
            this.ruleset.push(rule);
        }
    }

    addRules(ruleset) {
        for (let i in ruleset) {
            this.addRule(ruleset[i]);
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
            let rulename = rule.rulename;
            this.deleteRule(rulename);
            this.addRule(rule);
        }
    }

    modifyRules(ruleset) {
        for (let i in ruleset) {
            let rule = ruleset[i];
            this.modifyRule(rule);
        }
    }

    getRules() {
        return this.ruleset;
    }


    setFeiertage(feiertage) {
        this.feiertage = feiertage;
    }

    evalTime(rule) {
        if (rule) {
            for (let i in rule.time) {
                let obj = rule.time[i];
                obj = inTime(obj, this.feiertage);
                rule.time[i] = obj;
            }
        }
        return rule;
    }


    evalStates(rule, callback) {
        if (rule) {
            getStatesByObjectArray(this.adapter, rule.state, callback);
        }
    }

    evalAll(rule, callback) {
        rule = this.evalTime(rule);
        this.evalStates(rule, (states) => {
            rule.state = states;
            callback && callback(rule);
        });
    }

    evalQuery(rule, callback) {
        let found = null;
        let sandbox = copyObject(buildEvalObjects([rule.time, rule.state]));
        //vm.createContext(sandbox);
        for (let i in rule.rule) {
            let obj = rule.rule[i];
            let code = obj.name + ' = ' + obj.query + ';';
            vm.runInNewContext(code, sandbox);
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
        callback && callback(found);
    }


    executeRules(callback) {
        for (let i in this.ruleset) {
            let rule = this.ruleset[i];
            this.evalAll(rule, (values) => {
                rule = values;
                this.evalQuery(rule, (val) => {

                    if (val && (val.oldRegel != val.regel || val.oldValue != val.value)) {
                        if (val.id) {
                            // Set Sate
                            // this.adapter.setForeignState(obj.id, obj.value)
                        }
                        if (val.callback) {
                            val.callback(val.value);
                        }
                        this.adapter.log.info(val.rulename + ", alte Regel " + val.oldRegel + ", neue Regel " + val.regel + ", von altem Wert " + val.oldValue + " auf neuen Wert " + val.value);
                    }
                    callback && callback(val);
                });
            });
        }
    }


}

module.exports = RulesControler;
