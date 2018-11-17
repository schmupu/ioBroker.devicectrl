'use strict';

var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var dp = require(__dirname + '/lib/datapoints');
var net = require('net');
var adapter = new utils.Adapter('ruleset');

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
