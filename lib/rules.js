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
// Prüft ob der heutige Tag z.B. Di im String "Mo,Di,..." erhalten ist
// **************************************************************************
function isWochetag(wochentag) {

    if (typeof wochentag == "undefined" || wochentag === "") { return true; }

    let tmp = wochentag.toString().trim().replace(/(\r\n|\n|\r|\t|\s)/g, "");
    let wtag = tmp.split(',');
    let now = new Date();
    let today = getWochentag();
    let holiday = false;  // isHoliday(); // ist heute ein Feiertag
    let urlaub = false; // onVacation(); // befinde ich mich im Urlaub

    // Wenn Feiertag oder Urlaub dann tun wir so ob Samstag wäre
    // Hd oder Vc
    if (holiday === true || urlaub === true) {
        today = "Sa";
    }

    for (var i = 0; i < wtag.length; i++) {
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
function inTime(obj) {

    if (!obj.hasOwnProperty("from")) { obj.from = "00:00"; }
    if (!obj.hasOwnProperty("to")) { obj.to = "24:00"; }
    if (!obj.hasOwnProperty("weekday")) { obj.weekday = ""; }
    if (!obj.hasOwnProperty("callback")) { obj.callback = function () { return true; } }

    let value = compareTime(obj.from, obj.to) && isWochetag(obj.weekday) && obj.callback();
    obj.oldValue = obj.hasOwnProperty("value") ? obj.value : undefined;
    obj.value = value;
    return obj;

}

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

function copyObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}


// *****************************************************************************************************
// ...
// *****************************************************************************************************
class RulesControler {

    constructor(adapter, polltime) {
        this.adapter = adapter;
        this.polltime = polltime || 15;
        this.ruleset = [];
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


    evalTime(rule) {
        if (rule) {
            for (let i in rule.time) {
                let obj = rule.time[i];
                obj = inTime(obj);
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

        let found = false;
        let sandbox = copyObject(buildEvalObjects([rule.time, rule.state]));
        //vm.createContext(sandbox);
        for (let i in rule.rule) {
            let obj = rule.rule[i];
            let query = obj.query || {};
            let name = obj.name || {};
            let code = name + ' = ' + query + ';';
            vm.runInNewContext(code, sandbox);
            if (found == false && sandbox.hasOwnProperty(name) && sandbox[name] == true) {
                found = true;
                rule.oldRegel = rule.regel;
                rule.regel = name;
                rule.oldValue = rule.value;
                rule.value = obj.value;
                // rule.value = sandbox[name];
                if (rule.oldRegel != rule.regel || rule.oldValue != rule.value) {
                    if (obj.id) {
                        // Set Sate
                        // this.adapter.setForeignState(obj.id, obj.value)
                    }
                    if (obj.callback) {
                        obj.callback(obj.value);
                    }
                    this.adapter.log.debug("Sandbox: " + JSON.stringify(sandbox));
                    this.adapter.log.debug("Code: " + code);
                    this.adapter.log.debug("rule: " + JSON.stringify(rule));
                    this.adapter.log.info("Setze " + rule.rulename + " auf Regel " + rule.regel + " mit dem Wert " + rule.value);
                }
            }
        }
        callback && callback(rule);
    }


    executeRules(callback) {
        for (let i in this.ruleset) {
            let rule = this.ruleset[i];
            this.evalAll(rule, (values) => {
                rule = values;
                this.evalQuery(rule, (val) => {
                    callback && callback(val);
                });
            });
        }
    }


}

module.exports = RulesControler;
