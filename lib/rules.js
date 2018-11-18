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
        this.rules = [];
    }

    init(objArrays) {
        if (objArrays) {
            objArrays.regel = undefined;
            objArrays.oldRegel = undefined;
            objArrays.value = undefined;
            objArrays.oldValue = undefined;
            // if (!objArrays.hasOwnProperty("regel")) { objArrays.regel = undefined; };
            // if (!objArrays.hasOwnProperty("oldRegel")) { objArrays.oldRegel = undefined; };
            // if (!objArrays.hasOwnProperty("value")) { objArrays.value = undefined; };
            // if (!objArrays.hasOwnProperty("oldValue")) {  objArrays.oldValue = undefined; };
            if (!objArrays.hasOwnProperty("time")) { objArrays.time = {}; }
            if (!objArrays.hasOwnProperty("state")) { objArrays.state = {}; }
            if (!objArrays.hasOwnProperty("rule")) { objArrays.rule = {}; }
            return objArrays;
        }
    }

    addRule(obj) {
        if (obj) {
            obj = this.init(copyObject(obj));
            this.rules.push(obj);
        }
    }

    addRules(objs) {
        for (let i in objs) {
            this.addRule(objs[i]);
        }
    }

    deleteRule(rulename) {
        // delete all
        if(rulename == '*') {
            this.rules = [];
        }
        // delete  entries by rulename
        for (let i = this.rules.length - 1; i >= 0; i--) {
            let obj = this.rules[i];
            if (obj.rulename == rulename) {
                this.rules.splice(i, 1);
            }
        }
    }

    deleteRules(objs) {
        for (let i in objs) {
            this.deleteRule(objs[i].rulename);
        }
    }

    modifyRule(obj) {
        let rulename = obj.rulename;
        this.deleteRule(rulename);
        this.addRule(obj);
    }

    modifyRules(objs) {
        for (let i in objs) {
            this.modifyRule(objs[i]);
        }
    }

    getRules() {
        return this.rules;
    }


    evalTime(objArray) {
        for (let i in objArray) {
            let obj = objArray[i];
            obj = inTime(obj);
        }
        return objArray;
    }


    evalStates(objArray, callback) {
        getStatesByObjectArray(this.adapter, objArray, callback);
    }

    evalAll(objArrays, callback) {

        objArrays.time = this.evalTime(objArrays.time);
        this.evalStates(objArrays.state, (values) => {
            objArrays.state = values;
            callback && callback(objArrays);
        });

    }

    query(objArrays, callback) {

        let found = false;
        let rule;
        let objArray = objArrays.rule;
        let sandbox = copyObject(buildEvalObjects([objArrays.time, objArrays.state]));
        //vm.createContext(sandbox);

        for (let i in objArray) {
            let obj = objArray[i];
            let query = obj.query || {};
            let name = obj.name || {};
            let code = name + ' = ' + query + ';';
            vm.runInNewContext(code, sandbox);

            if (found == false && sandbox.hasOwnProperty(name) && sandbox[name] == true) {
                found = true;
                objArrays.oldRegel = objArrays.regel;
                objArrays.regel = name;
                objArrays.oldValue = objArrays.value;
                objArrays.value = obj.value;
                // objArrays.value = sandbox[name];
                if (objArrays.oldRegel != objArrays.regel || objArrays.oldValue != objArrays.value) {
                    if (obj.id) {
                        // Set Sate
                        // this.adapter.setForeignState(obj.id, obj.value)
                    }
                    if (obj.callback) {
                        obj.callback(obj.value);
                    }
                    this.adapter.log.debug("Sandbox: " + JSON.stringify(sandbox));
                    this.adapter.log.debug("Code: " + code);
                    this.adapter.log.debug("objArrays: " + JSON.stringify(objArrays));
                    this.adapter.log.info("Setze " + objArrays.rulename + " auf Regel " + objArrays.regel + " mit dem Wert " + objArrays.value);
                }
            }
        }
        callback && callback(objArrays);
    }


    executeRules(callback) {
        for (let i in this.rules) {
            let obj = this.rules[i];
            this.evalAll(obj, (values) => {
                obj = values;
                this.query(obj, (val) => {
                    callback && callback(val);
                });
            });
        }
    }


}

module.exports = RulesControler;
