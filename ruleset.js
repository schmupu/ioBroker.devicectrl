'use strict';

var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var dp = require(__dirname + '/lib/datapoints');
var rulesset = require(__dirname + '/lib/rules');
var net = require('net');
var adapter = new utils.Adapter('ruleset');
var vm = require('vm');
var rules = new rulesset(adapter);

// *****************************************************************************************************
// is called when adapter shuts down - callback has to be called under any circumstances!
// *****************************************************************************************************
adapter.on('unload', (callback) => {
  try {
    adapter.log.info('Closing ruleset Adapter');

    if (server) {
      server.close();
    }
    callback();
  } catch (e) {
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

  switch (command) {
    case 'add':
      rules.addRule(parameter);
      break;
    case 'delete':
      rules.deleteRule(parameter);
      break;
    case 'modify':
      rules.modifyRule(parameter);
      break;
    default:
      break;
  }

  rules.executeRules((values) => {
    // callback && callback(values);
  });

});


// *****************************************************************************************************
// is called when databases are connected and adapter received configuration.
// start here!
// *****************************************************************************************************
adapter.on('ready', () => {
  main();
});


// *****************************************************************************************************
// Main function
// *****************************************************************************************************
function main() {

  adapter.log.info("Starting Adapter");

}