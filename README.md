![Logo](admin/devicectrl.png)

# Controlling Devices with Rules


[![Travis CI Build Status](https://travis-ci.org/schmupu/ioBroker.devicectrl.svg?branch=master)](https://travis-ci.org/schmupu/ioBroker.devicectrl)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/schmupu/ioBroker.devicectrl?branch=master&svg=true)](https://ci.appveyor.com/project/schmupu/ioBroker-devicectrl/)
![Number of Installations](http://iobroker.live/badges/devicectrl-installed.svg) ![Number of Installations](http://iobroker.live/badges/devicectrl-stable.svg) [![NPM version](http://img.shields.io/npm/v/iobroker.devicectrl.svg)](https://www.npmjs.com/package/iobroker.devicectrl)
[![Downloads](https://img.shields.io/npm/dm/iobroker.devicectrl.svg)](https://www.npmjs.com/package/iobroker.devicectrl)

[![NPM](https://nodei.co/npm/iobroker.devicectrl.png?downloads=true)](https://nodei.co/npm/iobroker.devicectrl/)

You can control devices by a set of rules. For example you turn on a light, switch or change the temperature to a given time or on sunrise or sundown at your place. Also you can change the state of the devices depending of a state of other devices. For example, turn on a light, if the alarm system is arm between 6 am and 8 am and 8 pm and 10 pm.

## Install & Configuration
In the moment you have to do the configuration by script. You have to do start the configuration script only if you add a new rule or change an existing rule.

The configuration ist not very complicated but not very user friendly in the moment. 


For every rule you have to create an object like this.
```
let kitchenLight = {

  rulename: "Kitchen Light", // name of rule
  active: true,                 // rule acitve

  time:   [ /* ... */ ],
  state:  [ /* ... */ ],
  rule:   [ /* ... */ ]

}
```
For adding or changing rules you have do following: 
```
// add rule kitchenLight 
sendTo("devicectrl.0", "add", kitchenLight, (result) => {
  console.log(result);
});

// add rule livingRoomLight
sendTo("devicectrl.0", "add", livingRoomLight, (result) => {
  console.log(result);
});

// save rule kitchenLight and livingRoomLight to all existing rules. 
// After saving, the adapter restarts and the rule is active.
// In the ioBroker Logfile you see errors if one exist. 
sendTo("devicectrl.0", "save", "", (result) => {
  console.log(result);
});
```
If you want to delete a rule you deactivate a rule by setting in the rule object the active flag to false or you delete the rule.
For deleting a rule you to do following:
```
// Deleting rule you call delete by adding the rulename. 
// Deleting rule "Kitchen Light"
sendTo("devicectrl.0", "delete", "Kitchen Light", (result) => {
  console.log("Delete: " + result);
});

// With Asterisk (*) you delete all rules
sendTo("devicectrl.0", "delete", "*", (result) => {
  console.log("Delete: " + result);
});
```

### Explanation of the rule object
Detailed explanation of the rule object.
```
let kitchenLight = {

  rulename: "Kitchen Light", // name of rule
  active: true,                 // rule acitve

  time:   [ /* ... */ ],
  state:  [ /* ... */ ],
  rule:   [ /* ... */ ]

}
```

**Rule name and Active flag**

*rulename*: the name of rule (string).
*active*: if rule shall be active or inactive (boolean) 
For example:


**Time**

**State**

**Rule**

## Changelog
### 0.1.4 (21.01.2019)
* (Stübi) delete old functions

### 0.1.3 (23.11.2018)
* (Stübi) changed to async functions

### 0.1.2 (23.11.2018)
* (Stübi) First Version


## License
The MIT License (MIT)

Copyright (c) 2018 Thorsten <thorsten@stueben.de> / <https://github.com/schmupu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
