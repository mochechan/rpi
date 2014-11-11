/* todo:
configuration for both B and B+
save server and all clients' ip addresses
Air Condition: auto temperature adjustment 
relay1 supports temperature and countdown mode
auto open/close window with step motor

3 different LEDs for indicators 

voice control:
1) Chinese input 2) Chinese/English/Japanese output 3) use google online api for quality 4) use USB sound card for input/output 
http://blog.oscarliang.net/raspberry-pi-voice-recognition-works-like-siri/
voice control:  http://www.raspberrypi.org/meet-jasper-open-source-voice-computing/
TTS: http://elinux.org/RPi_Text_to_Speech_(Speech_Synthesis)
http://programmermagazine.github.io/home/

to query all significient events 
to startup automatically (/etc/rc.local is now fail)
//to shutdown -r now when disconnected for a long time
client can control by command line with username=control message=predefined
PIR hardware adjust


*/

console.log(global);
console.log(process);
console.log(module);
console.log(__filename);
console.log(__dirname);

// list of argv
process.argv.forEach(function (val, index, array) {
  console.log( ' argv' + index + ': ' + val + " " );
});

// to require some nodejs packages
//var util = require('util');
var exec = require('child_process').exec;

var conf = {
  gpioin: {flame1: "25", pir1: "29"},
  gpioout: {relay1: "22", relay2: "26"},
};

var status = {};
status.relay1countdown = status.relay2countdown = 0;
status.internetSuccess = status.internetFailure = 0;

var clients = {}; // Clients list

// Broadcast to all clients
function broadcast(message){
  for (var client in clients) clients[client].write(JSON.stringify(message));
}


// create sockjs server
var echo = require('sockjs').createServer();

// on new connection event
echo.on('connection', function(conn) {
  console.log(conn.remoteAddress + ":" + conn.remotePort + " " + conn.headers.host);

  // add this client to clients object
  console.log("on connection " + conn.id );
  clients[conn.id] = conn;

  // on receive new data from client event
  conn.on('data', function(message) {
    console.log("on data " + conn.id + message);
    var msg = JSON.parse(message);

    if (msg.request === 'relay1on') {
      relay1on();
    } else if (msg.request === 'relay1off') {
      relay1off();
    } else if (msg.request === "relay1countdown") {
      status.relay1countdown += 10 * 60;
    } else if (msg.request === "relay1mode") {
      if ( status.relay1mode === 'temperature' ) status.relay1mode = "countdown";
      else if ( status.relay1mode === 'countdown' ) status.relay1mode = "temperature";
      else status.relay1mode = "countdown";
    } else if (msg.request === 'relay2on') {
      relay2on();
    } else if (msg.request === 'relay2off') {
      relay2off();
    } else if (msg.request === 'relay2countdown') {
      status.relay2countdown += 10 * 60;
    } else if (msg.request === "ac_on") {
      ac("ac_on");
    } else if (msg.request === "ac_off") {
      ac("ac_off");
    } else if (msg.request === "ac_to20") {
      ac("ac_to20");
    } else if (msg.request === "ac_to21") {
      ac("ac_to21");
    } else if (msg.request === "ac_to22") {
      ac("ac_to22");
    } else if (msg.request === "ac_to23") {
      ac("ac_to23");
    } else if (msg.request === "ac_to24") {
      ac("ac_to24");
    } else if (msg.request === "ac_to25") {
      ac("ac_to25");
    } else if (msg.request === "ac_to26") {
      ac("ac_to26");
    } else if (msg.request === "ac_to27") {
      ac("ac_to27");
    } else if (msg.request === "ac_to28") {
      ac("ac_to28");
    } else if (msg.request === "ac_to29") {
      ac("ac_to29");
    } else if (msg.request === "ac_to30") {
      ac("ac_to30");
    } else {
      console.log("else error");
      console.log(message);
      console.log(message.request);
    }
    broadcast(JSON.parse(message));
  });

  // on connection close event
  conn.on('close', function() {
    console.log("on close " + conn.id );
    delete clients[conn.id];
  });

});

// Create an http server
var server = require('http').createServer();

// 2. Static files server
var node_static = require('node-static');
var static_directory = new node_static.Server(__dirname);
server.addListener('request', function(req, res) {
  static_directory.serve(req, res); //require('node-static').Server(__dirname).serve(req, res); // index.html
});
server.addListener('upgrade', function(req,res){
  res.end();
});

// Integrate SockJS and listen on /echo
echo.installHandlers(server, {prefix:'/echo'});

// Start server
server.listen(8080, '0.0.0.0');

// 1) to read humidity and temperature periodically 2) check Internet connectivity
status.counter2 =0;
status.missed =0;
setInterval(function() {
  status.counter2++;
  var output="";
  exec("loldht 7 | grep Temp ", function (error, stdout, stderr) {
    //console.log("stdout:");  
    //console.log(stdout);  
    //console.log("stderr:");  
    //console.log(stdout);  
    try {
      if (stderr) {
        var output = JSON.parse(stderr); // stderr 
      } else {
        var output = JSON.parse(stdout); // stdout
      }
      status.humidity = output.Humidity;
      status.temperature = output.Temperature;
    } catch(err) {
      console.log('stdout: ' + stdout);
      console.log('wrong: ' + err + "\n\n" + err.message);
      console.log('stderr: ' + stderr);
      status.missed++;
    }

    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });

  exec("vcgencmd measure_temp", function(error, stdout, stderr){
    status.cpuTemperature = stdout;
// todo: number part only
  });

  exec("ping -c 1 google.com ", function(error, stdout, stderr){
    if(error || stderr){ status.internetFailure++;
    } else { status.internetSuccess++; } 
  });

}, 12345);

// to read sensors periodically: flame, PIR
setInterval(function(){
  exec("gpio read 29 ; gpio read 25 ; gpio read 22 ; gpio read 26  ", function(error, stdout, stderr) {
    //22 relay1, 26 relay2, 
    //console.log(stdout); //output of gpio status 
    var gpioarr = stdout.split("");
    gpioarr.forEach(function (val, index, array) {
      if(index === 0) status.PIRgpio = val.replace(/\n$/, '');
      if(index === 2) status.flameGpio = val.replace(/\n$/, '');
      if(index === 4) status.relay1gpio = val.replace(/\n$/, '');
      if(index === 6) status.relay2gpio = val.replace(/\n$/, '');
      //console.log(" index:" + index + " val:" + val.replace(/\n$/, '') + " ");
    });
  });

  if (! status.relay1countdown) {
    status.relay1countdown = 0;
  } else if (status.relay1countdown > 1) {
    status.relay1countdown--;
  } else if (status.relay1countdown = 1) {
    status.relay1countdown--;
    if (status.relay1gpio === '1') relay1on();
    else if (status.relay1gpio === '0') relay1off();
    else {}
  } else {}

  if (! status.relay2countdown) {
    status.relay2countdown = 0;
  } else if (status.relay2countdown > 1) {
    status.relay2countdown--;
  } else if (status.relay2countdown = 1) {
    status.relay2countdown--;
    if (status.relay2gpio === '1') relay2on();
    else if (status.relay2gpio === '0') relay2off();
    else {console.log("error:190");}
  } else {console.log("error:191");}

  status.username = "system";
  status.timestamp = (new Date) + " #" + Object.keys(clients).length;

  if (status.relay1gpio === "0") status.relay1 = "on";
  else if (status.relay1gpio === "1") status.relay1 = "off";
  else status.relay1 = "error";

  if (status.relay2gpio === "0") status.relay2 = "on";
  else if (status.relay2gpio === "1") status.relay2 = "off";
  else status.relay2 = "error";

  if (status.PIRgpio === "0") status.PIR = "on";
  else if (status.PIRgpio === "1") status.PIR = "off";
  else status.PIR = "error";

  if (status.flameGpio === "0") status.flame = "on";
  else if (status.flameGpio === "1") status.flame = "off";
  else status.flame = "error";

  status.onlineClients = [];
  for (var client in clients) {
    status.onlineClients.push(clients[client].remoteAddress);
  }

  broadcast(status);
  LOG(status);
}, 1000 );

// to initiate GPIO pins 
exec("gpio mode 29 in ; gpio mode 25 in ; gpio mode 22 out ; gpio mode 26 out ", function(error, stdout, stderr) {
  console.log(stdout);
});

function relay1on () {
  exec("./speech_google.sh I am going to trun on the relay one.", function (error, stdout, stderr) {});
  exec("gpio write 22 0", function (error, stdout, stderr) {});
  status.relay1countdown = 0;
}

function relay1off () {
  exec("./speech_google.sh I am going to trun off the relay one.", function (error, stdout, stderr) {});
  exec("gpio write 22 1", function (error, stdout, stderr) {});
  status.relay1countdown = 0;
}

function relay2on () {
  exec("./speech_google.sh I am going to trun on the relay 2.", function (error, stdout, stderr) {});
  exec("gpio write 26 0", function (error, stdout, stderr) {});
  status.relay2countdown = 0;
}

function relay2off () {
  exec("./speech_google.sh I am going to trun off the relay 2.", function (error, stdout, stderr) {});
  exec("gpio write 26 1", function (error, stdout, stderr) {});
  status.relay2countdown = 0;
}

function ac (action) {
  console.log(action);
  exec("./speech_google.sh I am going to manipulate the air condition.", function (error, stdout, stderr) {});
  status.lastACstatus = action;
  if (action === 'ac_on') exec("irsend SEND_ONCE lircd_ac.conf power_on", function (error, stdout, stderr) {});
  else if (action === 'ac_off') exec("irsend SEND_ONCE lircd_ac.conf power_off", function (error, stdout, stderr) {});
  else if (action === 'ac_to20') exec("irsend SEND_ONCE lircd_ac.conf to20", function (error, stdout, stderr) {});
  else if (action === 'ac_to21') exec("irsend SEND_ONCE lircd_ac.conf to21", function (error, stdout, stderr) {});
  else if (action === 'ac_to22') exec("irsend SEND_ONCE lircd_ac.conf to22", function (error, stdout, stderr) {});
  else if (action === 'ac_to23') exec("irsend SEND_ONCE lircd_ac.conf to23", function (error, stdout, stderr) {});
  else if (action === 'ac_to24') exec("irsend SEND_ONCE lircd_ac.conf to24", function (error, stdout, stderr) {});
  else if (action === 'ac_to25') exec("irsend SEND_ONCE lircd_ac.conf to25", function (error, stdout, stderr) {});
  else if (action === 'ac_to26') exec("irsend SEND_ONCE lircd_ac.conf to26", function (error, stdout, stderr) {});
  else if (action === 'ac_to27') exec("irsend SEND_ONCE lircd_ac.conf to27", function (error, stdout, stderr) {});
  else if (action === 'ac_to28') exec("irsend SEND_ONCE lircd_ac.conf to28", function (error, stdout, stderr) {});
  else if (action === 'ac_to29') exec("irsend SEND_ONCE lircd_ac.conf to29", function (error, stdout, stderr) {});
  else if (action === 'ac_to30') exec("irsend SEND_ONCE lircd_ac.conf to30", function (error, stdout, stderr) {});
  else console.log("error: ac else error");
}

var exe = function (cmd) {
  exec(cmd, function (error, stdout, stderr) {
     
  });
}

// to get current timestamp
function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + "/" + month + "/" + day + "-" + hour + ":" + min + ":" + sec;
}

var clone = function (obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}


// to write a LOG file
var prevStatus = {}; // previous status
var LOG = function (obj) {
  if ( status.relay1 === prevStatus.relay1 
    && status.relay2 === prevStatus.relay2 
    && status.relay1mode === prevStatus.relay1mode
    && status.PIR === prevStatus.PIR 
    && status.flame === prevStatus.flame 
    && status.humidity === prevStatus.humidity 
    && status.temperature === prevStatus.temperature ) {
  } else {
    prevStatus = clone(status);
    var string = JSON.stringify(obj);
    try {
      require('fs').appendFile("./LOG2.txt", string + "\n", function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("LOGed:" + string);
        }
      }); 
    } catch (err) { if (err) console.log(err); } 
  }
}

/* current functions:
2-way relay control
IR LED and receiver; air condition tested
web-based user interface with websocket
Google's Text to Speech engine
*/

// end of file 
