![Logo](admin/devicectrl.png)

# Aufgabe von Devicectrl
Mit dem Adapter Devicectrl kannst Du ein Regelwerk erstellen um Deine ioBroker Devices bzw. Objekte anhand von Bedingungen Ereignisse auszuführen wie z.B. das anschalten einer Lampe jeden Samstag um 6 Uhr. 

Folgende Regeln gibt es:  
* time: Zu bestimmten Zeiten und Wochentagen kann ein Ereignis ausgeführt werden
* states: In Abhängigkeiten vo Zustand anderer States ist eine Regel zuständig
* rule: Logischer Ausdruck, wann eine Regel ausgeführt wird. 

# Aufbau einer Regel
Bisher gibt es noch keine Oberfläche um Regeln zu erstellen und zu pflegen. Es ist der Javascript Adapter zu installieren um einen Konfiguration zu erstellen. 
Das Regelwerk ist als JSON Objket zu hinterlegen. Der Aufbau sieht wie folgt aus:

```
let kitchenLight = {

  rulename: "Kitchen Light",    // name of rule
  active: true,                 // rule acitve

    time: [
        { name: "t1", from: "06:00", to: "22:00", weekday: "" }
    ],

    state: [
        { name: "a", id: "javascript.0.Apple.Alarm.anwesend"          /*Anwesenheit*/ },
        { name: "h", id: "javascript.0.Apple.Alarm.heizungssteuerung" /*Heizungssteuerung*/ }
    ],

    rule: [
        { name: "r1", query: "(a.v && h.v) && (t1.v)", id: "hm-rega.0.15576"/*Temperatur Flur Keller*/, value: 17.0 },
        { name: "r2", query: "(a.v && h.v)",  id: "hm-rega.0.15576"/*Temperatur Flur Keller*/, value: 16.0 },
        { name: "r3", query: "(a.v === false && h.v === true)", id: "hm-rega.0.15576"/*Temperatur Flur Keller*/, value: 5.0 }
    ]

}
```

Regelwerk in dem Devicectrl Adapter übertragen und sichern: 
```
// Regel kitchenLight hinzufügen 
sendTo("devicectrl.0", "add", kitchenLight, (result) => {
  console.log(result);
});

// Regel livingRoomLight hinzufügen
sendTo("devicectrl.0", "add", livingRoomLight, (result) => {
  console.log(result);
});

// Relgen kitchenLight und livingRoomLight sichern. Der Adapter staretet
// anschließend neu. Fehler im Regelwerk siehst Du im ioBroker Logfile
sendTo("devicectrl.0", "save", "", (result) => {
  console.log(result);
});
```

Du kannst auch Regeln löschen oder deaktivieren. Um eine Regel zu deaktiveren setzt Du in der Regel das active Kennzeichen auf false. Um eine Regel zu löschen gehst Du wie folgt vor:
```
// Löschen der Relgel "Kitchen Light"
sendTo("devicectrl.0", "delete", "Kitchen Light", (result) => {
  console.log("Delete: " + result);
});

// Mit * löscht Du alle Regelen
sendTo("devicectrl.0", "delete", "*", (result) => {
  console.log("Delete: " + result);
});

// Mit save werden die Änderungen gespeichert
sendTo("devicectrl.0", "save", "", (result) => {
  console.log(result);
});
```
Wichtig: Die Regel wird erst mit dem sendTo save Kommando ausgeführt! Mit dem sendTo und add, delete, ... Kommando wird die Regel nur an den Adapter übertragen aber noch nicht dort gespeichert und ausgeführt.   

## Aufbau einer Regel
Detailierte Beschreibung des Aufbaus einer Regel

```
let kitchenLight = {

  rulename: "Kitchen Light",    // name of rule
  active: true,                 // rule acitve

    time: [
        { name: "t1", from: "06:00", to: "22:00", weekday: "" }
    ],

    state: [
        { name: "a", id: "javascript.0.Apple.Alarm.anwesend"          /*Anwesenheit*/ },
        { name: "h", id: "javascript.0.Apple.Alarm.heizungssteuerung" /*Heizungssteuerung*/ }
    ],

    rule: [
        { name: "r1", query: "(a.v && h.v) && (t1.v)", id: "hm-rega.0.15576"/*Temperatur Flur Keller*/, value: 17.0 },
        { name: "r2", query: "(a.v && h.v)",  id: "hm-rega.0.15576"/*Temperatur Flur Keller*/, value: 16.0 },
        { name: "r3", query: "(a.v === false && h.v === true)", id: "hm-rega.0.15576"/*Temperatur Flur Keller*/, value: 5.0 }
    ]

}
```

**Regelname and Active Kennzeichen**
```
let kitchenLight = {
  rulename: "Kitchen Light",    // name of rule
  active: true,                 // rule acitve
  /* ... */
}
```
*rulename*:   
Eindeutiger Name einer Regel. Anhand des 'rulename' kann eine Regel gelöscht werden. Dieser wird auch immer im Logfile angegeben.

*active*:     
Mit dem 'active' Kennzeichen kann eine Regel aktiviert (true) oder dekativiert (false) werden.

**Time**
Jede Regel kann abhängig von einer Zeit ein Ereignis ausführen. 
Der Aufbau sieht wie folgt aus:

```
let kitchenLight = {

    /* ... */

    time: [
        { name: "t1", from: "06:00", to: "22:00", weekday: "" },
        { name: "t2", from: "sunrise", to: "sunset", weekday: "" },
        { name: "t3", from: "15:00,16:00", to: "18:00,19:00", weekday: "" },
    ],
    
    /* ... */

}
```
*name*
Name der einzelnen Zeitregeln wie z.B. t1, t2, t3, morgens oder z.B. abends. Der Name muss in einer Regel eindeutig sein. In dem Besipiel oben gibt es 3 Zeitregeln für Kitchen Light. Regel t1 ist wahr zwischen 6 und 22 Uhr, egal welcher Werktag. Regel t2 ist gültig (true) zwischen Sonnenaufgang und Sonnenuntergang, egal welcher Werktag.

*from und to*
Die Variable from unt to kann folgende Werte enthalten:  
* "HH:MM":  Uhrzeit in HH:MM oder HH:MM:SS. Ab der Uhrzeit gilt die Regel bzw. ist die Regel gültig.
* "HH:MM,hh:mm": Es können auch zwei Uhrzeiten getrennt mit Komma in from oder/und to stehen. Dann wird per Zufall, jeden Tag eine neue Uhrzeit zwischen "HH:MM,hh:mm" ermittelt. Bsp. steht in from  "14:00,15:00", wird eine Zeit zwischen 14 und 15 wie z.B. 14:17 ermittelt. Das kann man z.B. für das zufällige an und ausschalten von Lampen nutzen.
* "sunrise" or "sunset": Statt einer Urhezit kann man auch sunrise (Sonnenaufgang) oder sunset (Sonneuntergang) angeben. Sunset und sunrise werden jeden Tag durch die entsprechende Uhrzeit ersetzt
* "sunrise,12:00": Auch ein Mix schwischen sunrise, sunset und Uhrzeit ist möglich. In dem Beispiel wird z.B ein zufällige Zeit swischen Sonneaufgagn und 12 Uhr berechnet. Ist z.b. Sonnenaufgang um 4 Uhr. Dann wird eine Uhrzeit zwischen 04 und 12 Uhr ermittelt, wie z.B. 10:23. Das geht natürlich auch umgekehrt wie z.B. "16:00,sunset".
* "sunset-02:00,sunset+02:00": Steht für Sonnenfaufgang - 2 Stunden und Sonnenuntergang  + 2 Stunden. Es wird wieder eine zufällige Zeit in diesem Zeitraum ermittelt.

*weekday*
Wochentage an dem die Regel gültig ist. Ist weekday leer, gilt die Zeitregel an allen Wochentagen. Wochentage können Mo, Tu, We, Th, Fr, Sa oder So sein.






