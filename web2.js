var conf = {
  httpPort: 8080,
  gpioIn: {flame1: "25", pir1: "29", gas1: "28"}, 
  gpioOut: {relay1: "22", relay2: "26"}, 
  gpioNot: {lircIn: "4", lircOut: "3", HT: "7", }, 
//Do not include any sensor gpio pin which is never controlled by this script: 1) LIRC controlled IR emitter and IR sensor; 2) humidity and temperature sensor; 3) 

};

//to enumerate conf
Object.keys(conf).forEach(function (val, index, array) {
  console.log( ' argv' + index + ': ' + val + " " + (typeof conf) );
});


/* todo:
configuration for both B and B+
to save server and all clients' ip addresses
Air Condition: auto temperature adjustment 
usb 5V -> dubon line out 
relay1 supports temperature and countdown mode
auto open/close window with step motor
dump first 10 lines of log file at startup
to construct lircd.conf by web-based UI: use mode2 to convert 
plot H/T figures
ultrasonic sensor / smell sensor
to list last 5 events 
humidity and temperature sensor with sudo
sg90 servo http://abyz.co.uk/rpi/pigpio/sitemap.html

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

miner bitcoin 

need HW: 10 LEDs, sound amplifer * 2,  

*/

//dump all system variables
//console.log(global);
//console.log(process);
//console.log(module);
//console.log(__filename);
//console.log(__dirname);


// list of argv
process.argv.forEach(function (val, index, array) {
  console.log( ' argv' + index + ': ' + val + " " );
});


// to require some nodejs packages
//var util = require('util');
var exec = require('child_process').exec;

// to initiate GPIO pins 
exec("gpio mode 29 in ; gpio mode 25 in ; gpio mode 22 out ; gpio mode 26 out ", function(error, stdout, stderr) {
  console.log(stdout);
});


var status = {};
status.relay1countdown = status.relay2countdown = 0;
status.internetSuccess = status.internetFailure = 0;

var clients = {}; // Clients list


// Broadcast to all clients
function broadcast(message){
  for (var client in clients) {
    clients[client].write(JSON.stringify(message));
  }
}


// create sockjs server
var echo = require('sockjs').createServer();

// on new connection event
echo.on('connection', function(conn) {
  console.log("sockjs echo.on connection " + conn.remoteAddress + ":" + conn.remotePort + " " + conn.headers.host);

  // add this client to clients object
  console.log("on connection " + conn.id );
  clients[conn.id] = conn;

  // on receive new data from client event
  conn.on('data', function(message) {
    console.log("sockjs conn.on data " + conn.id + message);
    var msg = JSON.parse(message);

    switch (msg.request) {
      case 'relay1on':
        relay1on();
        break;
      case 'relay1off':
        relay1off();
        break;
      case "relay1countdown":
        status.relay1countdown += 10 * 60;
        break;
      case "relay1mode":
        if ( status.relay1mode === 'temperature' ) {
          status.relay1mode = "countdown";
        } else if ( status.relay1mode === 'countdown' ) {
          status.relay1mode = "temperature";
        } else {
          status.relay1mode = "countdown";
        }
        break;
      case 'relay2on':
        relay2on();
        break;
      case 'relay2off':
        relay2off();
        break;
      case 'relay2countdown':
        status.relay2countdown += 10 * 60;
        break;
      case "ac_on":
        ac("ac_on");
        break;
      case "ac_off":
        ac("ac_off");
        break;
      case "ac_to20":
        ac("ac_to20");
        break;
      case "ac_to21":
        ac("ac_to21");
        break;
      case "ac_to22":
        ac("ac_to22");
        break;
      case "ac_to23":
        ac("ac_to23");
        break;
      case "ac_to24":
        ac("ac_to24");
        break;
      case "ac_to25":
        ac("ac_to25");
        break;
      case "ac_to26":
        ac("ac_to26");
        break;
      case "ac_to27":
        ac("ac_to27");
        break;
      case "ac_to28":
        ac("ac_to28");
        break;
      case "ac_to29":
        ac("ac_to29");
        break;
      case "ac_to30":
        ac("ac_to30");
        break;
      default:
        console.log("error: incorrect request ");
        console.log(message);
        console.log(message.request);
    }
    broadcast(JSON.parse(message));
  });

  // on connection close event
  conn.on('close', function() {
    console.log("sockjs conn.on close " + conn.id );
    delete clients[conn.id];
  });

});

// Create an http server
var server = require('http').createServer();

// 2. Static files server
var node_static = require('node-static');
var static_directory = new node_static.Server(__dirname);
server.addListener('request', function(req, res) {
  static_directory.serve(req, res); //for index.html
  //require('node-static').Server(__dirname).serve(req, res); // incorrect
});

server.addListener('upgrade', function(req,res){
  res.end();
});

// Integrate SockJS and listen on /echo
echo.installHandlers(server, {prefix:'/echo'});

// Start server
server.listen(conf.httpPort, '0.0.0.0');

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
    status.cpuTemperature = stdout.match(/[0-9\.]+/g)[0];
  });

  exec("ping -c 1 google.com ", function(error, stdout, stderr){
    if(error || stderr){ 
      status.internetFailure++;
    } else { 
      status.internetSuccess++; 
    } 
  });

}, 23456);

// to read sensors periodically: flame, PIR
setInterval(function(){
  exec("gpio read 29 ; gpio read 25 ; gpio read 22 ; gpio read 26  ", function(error, stdout, stderr) {
    //22 relay1, 26 relay2, 
    //console.log(stdout); //output of gpio status 
    var gpioarr = stdout.split("");
    gpioarr.forEach(function (val, index, array) {
      switch (index) {
        case 0:
          status.PIRgpio = val.replace(/\n$/, '');
          break;
        case 2:
          status.flameGpio = val.replace(/\n$/, '');
          break;
        case 4: 
          status.relay1gpio = val.replace(/\n$/, '');
          break;
        case 6: 
          status.relay2gpio = val.replace(/\n$/, '');
          break;
        default:
          break;
      }
      //console.log(" index:" + index + " val:" + val.replace(/\n$/, '') + " ");
    });
  });

  if (! status.relay1countdown) {
    status.relay1countdown = 0;
  } else if (status.relay1countdown > 1) {
    status.relay1countdown--;
  } else if (status.relay1countdown == 1) {
    status.relay1countdown--;
    switch (status.relay2gpio) {
      case '1':
        relay1on();
        break;
      case '0': 
        relay1off();
        break;
      default:
        console.log("error: must debug");
        break;
    }
  } else {
    console.log("error:190");
  }

  if (! status.relay2countdown) {
    status.relay2countdown = 0;
  } else if (status.relay2countdown > 1) {
    status.relay2countdown--;
  } else if (status.relay2countdown = 1) {
    status.relay2countdown--;
    switch (status.relay2gpio) {
      case '1':
        relay2on();
        break;
      case '0':
        relay2off();
        break;
      default:
        console.log("error: must debug");
        break;
    }

  } else {
    console.log("error:191");
  }

  status.username = "system";
  status.timestamp = new Date().toString();
  status.concurrent_clients = Object.keys(clients).length;

  switch (status.relay1gpio) {
    case "0": 
      status.relay1 = "on";
      break;
    case "1": 
      status.relay1 = "off";
      break;
    default:
      status.relay1 = "error";
      break;
  }

  switch (status.relay2gpio) {
    case "0":
      status.relay2 = "on";
      break;
    case "1":
      status.relay2 = "off";
      break;
    default: 
      status.relay2 = "error";
      break;
  }

  switch (status.PIRgpio) {
    case "0":
      status.PIR = "on";
      break;
    case "1":
      status.PIR = "off";
      break;
    default:
      status.PIR = "error";
      break;
  }

  switch (status.flameGpio) {
    case "0":
      status.flame = "on";
      break;
    case "1":
      status.flame = "off";
      break;
    default:
      status.flame = "error";
      break;
  }

  status.onlineClients = [];
  for (var client in clients) {
    status.onlineClients.push(clients[client].remoteAddress);
  }

  broadcast(status);
  LOG(status);
}, 1000 );



function relay1on () {
  exec("./speech_google.sh I am going to trun on the relay one.");
  exec("gpio write 22 0");
  status.relay1countdown = 0;
}

function relay1off () {
  exec("./speech_google.sh I am going to trun off the relay one.");
  exec("gpio write 22 1");
  status.relay1countdown = 0;
}

function relay2on () {
  exec("./speech_google.sh I am going to trun on the relay 2.");
  exec("gpio write 26 0");
  status.relay2countdown = 0;
}

function relay2off () {
  exec("./speech_google.sh I am going to trun off the relay 2.");
  exec("gpio write 26 1");
  status.relay2countdown = 0;
}

function ac (action) {
  console.log(action);
  exec("./speech_google.sh I am going to manipulate the air condition.");
  status.lastACstatus = action;
  switch (action) {
    case 'ac_on': 
      exec("irsend SEND_ONCE lircd_ac.conf power_on");
      break;
    case 'ac_off': 
      exec("irsend SEND_ONCE lircd_ac.conf power_off");
      break;
    case 'ac_to20': 
      exec("irsend SEND_ONCE lircd_ac.conf to20");
      break;
    case 'ac_to21':
      exec("irsend SEND_ONCE lircd_ac.conf to21");
      break;
    case 'ac_to22': 
      exec("irsend SEND_ONCE lircd_ac.conf to22");
      break;
    case 'ac_to23': 
      exec("irsend SEND_ONCE lircd_ac.conf to23");
      break;
    case 'ac_to24': 
      exec("irsend SEND_ONCE lircd_ac.conf to24");
      break;
    case 'ac_to25':
      exec("irsend SEND_ONCE lircd_ac.conf to25");
      break;
    case 'ac_to26': 
      exec("irsend SEND_ONCE lircd_ac.conf to26");
      break;
    case 'ac_to27':
      exec("irsend SEND_ONCE lircd_ac.conf to27");
      break;
    case 'ac_to28':
      exec("irsend SEND_ONCE lircd_ac.conf to28");
      break;
    case 'ac_to29':
      exec("irsend SEND_ONCE lircd_ac.conf to29");
      break;
    case 'ac_to30':
      exec("irsend SEND_ONCE lircd_ac.conf to30");
      break;
    default:
      console.log("error: ac else error");
      break;
  }
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
    if (null == obj || "object" != typeof obj) {
      return obj;
    }

    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          copy[attr] = obj[attr];
        }
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
          //console.log("LOGed:" + string);
        }
      }); 
    } catch (err) { 
      if (err) console.log(err); 
    } 
  }
}


// read command line from console
var rl = require('readline').createInterface({input: process.stdin, output: process.stdout});
rl.setPrompt('conf,hello,status,quit>');
rl.prompt();

rl.on('line', function(line) {
  switch(line.trim()) {
    case 'conf':
      console.log(conf);
      break;
    case 'hello':
      console.log('world!');
      break;
    case 'status':
      console.log(status);
      break;
    case 'quit':
      console.log('quit!');
      process.exit(0);
      break;
    default:
      console.log('The command is not recognizable: `' + line.trim() + '`');
      break;
  }
  rl.prompt();
}).on('close', function() {
  console.log('Have a great day!');
  process.exit(0);
}).on('pause', function() {
    console.log('Readline paused.');
}).on('resume', function() {
    console.log('Readline resumed.');
}).on('SIGINT', function() {
    rl.question('You press ctrl-c. Are you sure you want to exit?', function(answer) {
      if (answer.match(/^y(es)?$/i)){ 
        rl.pause();
        console.log("going to quit web2");
        process.exit(0);
      }
    });
}).on('SIGTSTP', function() {
    console.log('SIGTSTP.');
});

/* current functions:
2-way relay control
IR LED and receiver; air condition tested
web-based user interface with websocket
Google's Text to Speech engine
*/

// end of file 


