/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';


// *****************************************************************************************************
// Runden 
// *****************************************************************************************************
function roundTemperature(value) {
  if (typeof number === 'number') {
    let z = value - parseInt(value);
    if (z < 0.5 || z > 0.5) { value = Math.round(value); }
  }
  return value;
}

// *****************************************************************************************************
// Objekte kopieren
// *****************************************************************************************************
function copyObject(obj) {
  return JSON.parse(JSON.stringify(obj));
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

/*
let test = {

  rulename: "Heizung Esszimmer",
  active: true,
  timeout: 5,
  intersection: true,
  ienum: [
    'enum.functions.light',
    'enum.rooms.living_room'
  ],
  ids: [
    'javascript.0.test.roler'
  ]
};
*/

class SetStatesAsync {

  constructor(adapter) {
    this.adapter = adapter;
    this.simulation = adapter.config.simulation || false;
    this.ruleset = {};
    this.events();
  }

  async addRule(rule) {
    try {
      if (rule && rule.rulename) {
        rule._ids = await this.getIdsByRule(rule);
        this.ruleset[rule.rulename] = rule;
        await this.subscribeRules(rule.rulename);
      }
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  async addRules(rules) {
    try {
      if (rules) {
        for (let i in rules) {
          let rule = rules[i];
          await this.addRule(rule);
        }
      }
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  getRules() {
    try {
      let ruleset = copyObject(this.ruleset);
      for (let i in ruleset) {
        let rule = ruleset[i];
        // delete all properties starts with _
        for (let j in rule) {
          if (j.startsWith('_')) {
            delete rule[j];
          }
        }
      }
      return ruleset;
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  events() {
    this.adapter.on('stateChange', (id, state) => {
      (async () => {
        try {
          if (id && state) {
            let value = state.val;
            let rules = await this.getRulesById(id);
            if (rules && rules.length > 0) {
              for (let i in rules) {
                let rule = rules[i];
                let rulename = rule.rulename;
                if (rule.active && rule.dutycycle && rule.dutycycle.id && rule.dutycycle.maxvalue) {
                  let dcstate = await this.adapter.getForeignStateAsync(rule.dutycycle.id);
                  if (dcstate && dcstate.val > rule.dutycycle.maxvalue) {
                    if (!rule.dutycycle._funct) {
                      this.adapter.log.info(`Dutycylce for ${rulename} is over max value (${dcstate.val} > ${rule.dutycycle.maxvalue})`);
                    }
                    rule.dutycycle._funct = async () => { await this.setStateByName(rulename, id, value); };
                    continue;
                  } else {
                    rule.dutycycle._funct = undefined;
                  }
                }
                await this.setStateByName(rulename, id, value);
                return;
              }
            }
            rules = await this.getDutyClycleById(id);
            if (rules && rules.length > 0) {
              for (let i in rules) {
                let rule = rules[i];
                let rulename = rule.rulename;
                if (rule.active && value < rule.dutycycle.maxvalue && rule.dutycycle._funct) {
                  this.adapter.log.info(`Parked dutycylce execution for ${rulename} will be started now`);
                  await rule.dutycycle._funct();
                  rule.dutycycle._funct = undefined;
                }
              }
            }
          }
        } catch (error) {
          this.adapter.log.error(error);
        }
      })();
    });
  }

  async delRule(rulename) {
    try {
      // if rulename is an object try to get the name from objectname
      if (typeof rulename === 'object' && rulename.hasOwnProperty('rulename')) {
        rulename = rulename.rulename;
      }
      if (rulename && this.ruleset.hasOwnProperty(rulename)) {
        delete this.ruleset[rulename];
      }
    } catch (error) {
      this.adapter.log.error(error);
    }
  }


  async setStateByName(rulename, eventid, value) {
    try {
      value = roundTemperature(value); // Runde auf 0, 0.5 oder 1
      let rule = this.ruleset[rulename];
      if (rule) {
        let timeout = rule.timeout || 10;
        this.adapter.log.debug(`setStateByName( ${rulename} , ${value} )`);
        rule._timer && clearTimeout(rule._timer);
        rule._timer = setTimeout(() => {
          (async () => {
            try {
              let ids = await this.getIdsByRulename(rulename);
              let eventobj = await this.adapter.getForeignObjectsAsync(eventid, 'state');
              let eventname = eventobj[eventid].common && eventobj[eventid].common.name ? eventobj[eventid].common.name : undefined;
              for (let i in ids) {
                let id = ids[i];
                let state = await this.adapter.getForeignStateAsync(id);
                if (state && state.val != value) {
                  let obj = await this.adapter.getForeignObjectsAsync(id, 'state');
                  let name = obj[id].common && obj[id].common.name ? obj[id].common.name : undefined;
                  let msg = `State change for '${rulename}' on '${eventname}' to '${value}'. '${name}' will be changed from '${state.val}' to '${value}'.`;
                  if (!this.simulation) {
                    await this.adapter.setForeignStateAsync(id, value);
                    this.adapter.log.info(msg);
                  } else {
                    this.adapter.log.info(`Simulation: ${msg}`);
                  }
                }
              }
            } catch (error) {
              this.adapter.log.error(error);
            }
          })();
        }, timeout * 1000);
      }
    } catch (error) {
      this.adapter.log.error(error);
    }
  }


  getRuleByName(rulename) {
    for (let i in this.ruleset) {
      let rule = this.ruleset[i];
      if (rulename === rule.rulename) {
        return rule;
      }
    }
    return undefined;
  }

  async getRulesById(id) {
    try {
      let ids = [];
      for (let i in this.ruleset) {
        let rule = this.ruleset[i];
        let ruleids = await this.getIdsByRulename(rule.rulename);
        for (let j in ruleids) {
          let rid = ruleids[j];
          if (id === rid) {
            ids.push(rule);
          }
        }
      }
      return ids;
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  async getRulenamesById(id) {
    try {
      let rulenames = [];
      for (let i in this.ruleset) {
        let rule = this.ruleset[i];
        let ruleids = await this.getIdsByRulename(rule.rulename);
        for (let j in ruleids) {
          let rid = ruleids[j];
          if (id === rid) {
            rulenames.push(rule.rulename);
          }
        }
      }
      return rulenames;
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  async subscribeRules(rulename) {
    try {
      let ids = await this.getIdsByRulename(rulename);
      for (let i in ids) {
        this.adapter.subscribeForeignStates(ids[i]);
      }
      let dutycyleid = await this.getDutyCycleIds(rulename);
      if (dutycyleid) {
        this.adapter.subscribeForeignStates(dutycyleid);
      }
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  async unsubscribeRules(rulename) {
    try {
      let ids = await this.getIdsByRulename(rulename);
      for (let i in ids) {
        this.adapter.unsubscribeForeignStates(ids[i]);
      }
      let dutycyleid = await this.getDutyCycleIds(rulename);
      if (dutycyleid) {
        this.adapter.unsubscribeForeignStates(dutycyleid);
      }
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  unsubscribeAllRules() {
    this.adapter.unsubscribeForeignStates('*');
  }

  getTimeOut(rulename) {
    let rule = this.getRuleByName(rulename);
    return rule ? rule.timeout : undefined;
  }

  isActive(rulename) {
    let rule = this.getRuleByName(rulename);
    return rule ? rule.active : false;
  }

  getDutyCycle(rulename) {
    let rule = this.getRuleByName(rulename);
    return rule ? rule.dutycycle : undefined;
  }

  getDutyCycleIds(rulename) {
    let rule = this.getRuleByName(rulename);
    return rule && rule.dutycycle ? rule.dutycycle.id : undefined;
  }

  getDutyClycleById(id) {
    let rules = [];
    for (let i in this.ruleset) {
      let rule = this.ruleset[i];
      if (rule.dutycycle && rule.dutycycle.id === id) {
        rules.push(rule);
      }
    }
    return rules;
  }

  getRulenameFromDutyClycleId(id) {
    let rulenames = [];
    let rules = this.getDutyClycleById(id);
    for (let i in rules) {
      let rule = rules[i];
      rulenames.push(rule.rulename);
    }
    return rulenames;
  }

  async getIdsByRule(rule) {
    try {
      if (!rule) return [];
      if (rule._ids) return rule._ids;
      let ids = [];
      let enums = await this.getStateIdfromEnums(rule.enum) || [];
      let ienums = await this.getStateIdfromEnumsIntersection(rule.ienum) || [];
      for (let i in rule.ids) {
        ids.push(rule.ids[i]);
      }
      return [].concat(ids, enums, ienums);

    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  async getIdsByRulename(rulename) {
    try {
      let rule = this.getRuleByName(rulename);
      return await this.getIdsByRule(rule);
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  async getStateIdfromEnums(enums) {
    try {
      let ret = [];
      let objs = await this.adapter.getForeignObjectsAsync('*', 'state');
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
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

  async getStateIdfromEnumsIntersection(enums) {
    try {
      let idsall;
      enums = (typeof enums === 'string') ? [enums] : enums;
      for (let i in enums) {
        let ids = await this.getStateIdfromEnums(enums[i]);
        if (idsall) {
          idsall = intersectionArrays([idsall, ids]);
        } else {
          idsall = ids;
        }
      }
      return idsall;
    } catch (error) {
      this.adapter.log.error(error);
    }
  }

}

module.exports = {
  'SetStatesAsync': SetStatesAsync
};