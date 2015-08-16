/* Server for Raspberry PI 

todo:
configuration for both B and B+
to save server and all clients' ip addresses
Air Condition: auto temperature adjustment 
mp3 player/management(upload/delete)
relay1 supports temperature and countdown mode
auto open/close window with step motor
dump first 10 lines of log file at startup
to construct lircd.conf by web-based UI: use mode2 to convert 
plot H/T figures by d3.js
ultrasonic sensor / smell sensor
to list last 5 events 
humidity and temperature sensor without sudo
media/mp3 player by web UI

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


small vehicle 
sg90 servo http://abyz.co.uk/rpi/pigpio/sitemap.html

DIY HW:
  external usb 5V GND -> dubon line out 

buy HardWare: 

*/


var conf = {
  httpPort: 8080,
  gpioIn: {flame1: "25", pir1: "29", gas1: "28"}, 
  gpioOut: {relay1: "22", relay2: "26", relay3: "24", relay4: "27"}, 
  gpioOn: {relay1: "1", relay2: "1", relay3: "1", relay4: "1"}, 
  gpioName: {relay1: "", relay2: "", relay3: "", relay4: ""},
  gpioNot: {lircIn: "4", lircOut: "3", HT: "7", }, 
//Do not include any sensor gpio pin which is never controlled by this script: 1) LIRC controlled IR emitter and IR sensor; 2) humidity and temperature sensor; 3) 
  sayEn: {
    acOff: "", 
    ac20:"",
    ac21:"",
    ac22:"",
    ac23:"",
    ac24:"",
    ac25:"",
    ac26:"",
    ac27:"",
    ac28:"",
    ac29:"",
    ac30:"",
    relay1on:"", 
    relay2off:"",
    relay2on:"",
    relay2off:"",
  },
  sayZh: {
    acOff: "", 
    ac20:"",
    ac21:"",
    ac22:"",
    ac23:"",
    ac24:"",
    ac25:"",
    ac26:"",
    ac27:"",
    ac28:"",
    ac29:"",
    ac30:"",
    relay1on:"", 
    relay2off:"",
    relay2on:"",
    relay2off:"",
  },
  schedule: [{hour: 6, minute: 20, message: "6/20 light's on"}, {hour: 14, minute: 53, message: "test"}], 
  
  ac: {
    thresholdHigh:25.7,
    thresholdLow:24.1,
  },
  fan: {
    thresholdHigh: 21.1,
    thresholdLow: 19.9,
  },
};



//to enumerate conf
console.log(conf);
Object.keys(conf).forEach(function (val, index, array) {
  console.log( ' argv' + index + ': ' + val + " " + (typeof conf) );
});



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
var http = require('http');
var fs = require('fs');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;



var exe = function (cmd) {
  exec(cmd, function (error, stdout, stderr) {
     if (stdout) console.log('stdout ' + stdout);
     if (stderr) console.log('stderr ' + stderr);
  });
}



//delete something, such as log files.
exe('rm -v LOG*');



// to initiate GPIO pins 
var initGpioCmd = "";
for (var i in conf.gpioIn) { initGpioCmd += " gpio mode " + conf.gpioIn[i] + " in ;"; }
for (var i in conf.gpioOut) { initGpioCmd += " gpio mode " + conf.gpioOut[i] + " out ;"; }
console.log("initGpioCmd: " + initGpioCmd);
exec(initGpioCmd, function(error, stdout, stderr) { console.log(stdout); });



var status = {};
status.startTime = new Date().toString();
status.relay1countdown = status.relay2countdown = 0;
status.internetSuccess = status.internetFailure = 0;
status.ac = {};
status.ac.control = "manual"; //manual or auto



var clients = {}; // Clients list



// Broadcast to all clients
function broadcast(message){
  for (var client in clients) {
    clients[client].write(JSON.stringify(message));
  }
}


// create sockjs server
var sockjs = require('sockjs').createServer();


// on new connection event
sockjs.on('connection', function(conn) {
  console.log("sockjs sockjs.on connection " + conn.remoteAddress + ":" + conn.remotePort + " " + conn.headers.host);

  // add this client to clients object
  console.log("on connection " + conn.id );
  clients[conn.id] = conn;

  // on receive new data from client event
  conn.on('data', function(message) {
    console.log("sockjs conn.on data " + conn.id + message);
    var msg = JSON.parse(message);
    
    if (msg.username === "say" ) say(msg.message);

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
      case "ac_off":
      case "ac_to20":
      case "ac_to21":
      case "ac_to22":
      case "ac_to23":
      case "ac_to24":
      case "ac_to25":
      case "ac_to26":
      case "ac_to27":
      case "ac_to28":
      case "ac_to29":
      case "ac_to30":
      case "ac_auto":
        ac(msg.request);
        break;
      case "RC30_power":
      case "RC30_mute":
      case "RC30_volume_plus1":
      case "RC30_volume_plus2":
      case "RC30_volume_minus1":
      case "RC30_volume_minus2":
      case "RC30_pc":
      case "RC30_aux":
      case "RC30_tre_plus":
      case "RC30_tre_minus":
      case "RC30_sw_plus":
      case "RC30_sw_minus":
		irsend(msg.request);
        break;
	case "videoOn":
		video({switch:'on'});
		break;
	case "videoOff":
		video({switch:'off'});
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
var server = http.createServer();

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
sockjs.installHandlers(server, {prefix:'/echo'});

// Start server
server.listen(conf.httpPort, '0.0.0.0');


/////////////////////////////////////////////
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
      status.humidity = parseFloat(output.Humidity);
      status.temperature = parseFloat(output.Temperature);
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
    status.cpuTemperature = parseFloat(stdout.match(/[0-9\.]+/g)[0]);
  });

  exec("ping -c 1 google.com ", function(error, stdout, stderr){
    if(error || stderr){ 
      status.internetFailure++;
    } else { 
      status.internetSuccess++; 
    } 
  });


  //if (status.fan.control) {
  //} else { status.fan.control = "manual"}

/* //most confortable: DHT22 at 26 degree 
  //auto-adjust AC: 23,24reduce 25balance 26,27increase 
  if (status.ac.control){
    if (status.ac.control === 'auto') {
      if (status.temperature > conf.ac.thresholdHigh) {
        //to decrease 
        switch(status.lastAuto){
          case 23:
            status.lastAuto = 23;
          break;
          case 24:
            status.lastAuto = 23;
          break;
          case 25:
            status.lastAuto = 24;
          break;
          case 26:
            status.lastAuto = 25;
          break;
          case 27:
            status.lastAuto = 26;
          break;
          default:
            console.log("out of control");
          break;
        }
      } else if (status.temperature < conf.ac.thresholdLow) {
        //to increase 

      }

    } else if (status.ac.control === 'manual' ) {

    }
  } else {
    status.ACcontrol = 'manual';
  }
*/

	acAutoAdjust({ac:conf.ac, temperature: status.temperature});
}, 23456);

var acAutoAdjust = function (d) {
	console.log("current: %j",d);

}

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
    switch (status.relay1gpio) {
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

  //exec("fswebcam view.jpg");
	var d = getDateTime({format:"json"});
	for (var i in conf.schedule) {
		var trigger = true; 
		if (conf.schedule[i].weekday && conf.schedule[i].weekday !== d.weekday ) trigger = false; 
		if (conf.schedule[i].day && conf.schedule[i].day !== d.day ) trigger = false; 
		if (conf.schedule[i].hour && conf.schedule[i].hour !== d.hour ) trigger = false; 
		if (conf.schedule[i].minute && conf.schedule[i].minute !== d.minute ) trigger = false; 

		if (trigger === true){
			console.log(d);
			console.log(conf.schedule[i]);
		}
	}

}, 1000 );



var relaySwitch = function (d) {
	console.log(d);
	switch (d.id) {
		case '1':
		case '2':
		case '3':
		case '4':
			console.log( 'gpio pin:' + conf.gpioOut['relay' + d.id] + " on:" + conf.gpioOn['relay' + d.id]);
			//console.log('gpio write ' + );
		break;
		default:
		break;
	}
}



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

var say = function (str) {

}

var sayZh = function (str) {
  console.log("say Zh: " + str);
  exec("./speech_googleZH.sh " + str);
}

var sayEn = function (str) {
  console.log("say English: " + str);
  exec("./speech_google.sh " + str);
}

function irsend (arg) {
  if (typeof arg === 'string')
    exec("irsend SEND_ONCE lircd_ac.conf " + arg);
}


function ac (action) {
  console.log(action);
  exec("./speech_google.sh I am going to manipulate the air condition.");
  status.ac.lastManual = action;
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
    case 'ac_auto':
      if (status.ac.control === 'manual') status.ac.control = 'auto';
      else if (status.ac.control === 'auto') status.ac.control = 'manual';
      else status.ac.control = 'manual'; 
      break;
    default:
      console.log("error: ac else error");
      break;
  }
}


// to get current timestamp
function getDateTime(arg) {
	var weekday = new Array(7);
	weekday[0]=  "Sunday";
	weekday[1] = "Monday";
	weekday[2] = "Tuesday";
	weekday[3] = "Wednesday";
	weekday[4] = "Thursday";
	weekday[5] = "Friday";
	weekday[6] = "Saturday";

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
	switch (arg.format) {
		case 'json':
			return {year:parseInt(year), month:parseInt(month), day:parseInt(day), weekday: weekday[date.getDay()], hour:parseInt(hour), minute: parseInt(min), second:parseInt(sec)};
		break;
		default:
			return year + "/" + month + "/" + day + "-" + hour + ":" + min + ":" + sec;
		break;
	}
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
      fs.appendFile("./LOG2.txt", string + "\n", function(err) {
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

//////////////////////// Begin of video
var STREAM_SECRET = process.argv[2] || 'yourpassword',
	STREAM_PORT = process.argv[3] || 8082,
	WEBSOCKET_PORT = process.argv[4] || 8084,
	STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

var width = 320,
	height = 240;

// Websocket Server
var socketServer = new (require('ws').Server)({port: WEBSOCKET_PORT});
socketServer.on('connection', function(socket) {
	// Send magic bytes and video size to the newly connected socket
	// struct { char magic[4]; unsigned short width, height;}
	var streamHeader = new Buffer(8);
	streamHeader.write(STREAM_MAGIC_BYTES);
	streamHeader.writeUInt16BE(width, 4);
	streamHeader.writeUInt16BE(height, 6);
	socket.send(streamHeader, {binary:true});

	console.log( 'New WebSocket Connection ('+socketServer.clients.length+' total)' );
	
	socket.on('close', function(code, message){
		console.log( 'Disconnected WebSocket ('+socketServer.clients.length+' total)' );
	});
});

socketServer.broadcast = function(data, opts) {
	for( var i in this.clients ) {
		if (this.clients[i].readyState == 1) {
			this.clients[i].send(data, opts);
		}
		else {
			console.log( 'Error: Client ('+i+') not connected.' );
			delete this.clients[i];
		}
	}
};


// HTTP Server to accept incomming MPEG Stream
var streamServer = http.createServer( function(request, response) {
	var params = request.url.substr(1).split('/');

	if( params[0] == STREAM_SECRET ) {
		width = (params[1] || 320)|0;
		height = (params[2] || 240)|0;
		
		console.log('Stream Connected: ' + request.socket.remoteAddress + 
			':' + request.socket.remotePort + ' size: ' + width + 'x' + height);
		request.on('data', function(data){
			socketServer.broadcast(data, {binary:true});
		});
	}
	else {
		console.log('Failed Stream Connection: '+ request.socket.remoteAddress + 
			request.socket.remotePort + ' - wrong secret.');
		response.end();
	}
}).listen(STREAM_PORT);

console.log('Listening for MPEG Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');

//-vf "drawtext=fontfile=/usr/share/fonts/TTF/Vera.ttf: text='%{localtime}': x=(w-tw)/2: y=h-(2*lh): fontcolor=white: box=1: boxcolor=0x00000000@1"
//ffmpeg -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b:v 800k -r 30 http://localhost:8082/yourpassword/640/480/
var ffmpeg = undefined;
var video = function (d) {

	switch (d.switch) {
		case 'on':
			if (ffmpeg !== undefined) return;
	exe('v4l2-ctl --set-ctrl=gain=512');
	ffmpeg = spawn('./ffmpeg', ['-loglevel','debug','-f','video4linux2','-i','/dev/video0','-f','mpeg1video','-b:v','123k','-s','352x288','-r','25','-vf',"drawtext=fontfile=/usr/share/fonts/TTF/Vera.ttf: text='%{localtime}': x=(w-tw)/2: y=h-(2*lh): fontcolor=white: box=1: boxcolor=0x00000000@1",'http://localhost:8082/' + STREAM_SECRET + '/352/288/']); 

	ffmpeg.stdout.on('data', function (data) {
	  //console.log('stdout: ' + data);
	});

	ffmpeg.stderr.on('data', function (data) {
		if (status.ffmpegBytes === undefined) {
			status.ffmpegBytes = data.length ;
		}
		else {
			status.ffmpegBytes = status.ffmpegBytes + data.length ;
		}
		fs.appendFile('LOGffmpeg.txt', data, function(){});
	});

	ffmpeg.on('close', function (code) {
	  console.log('child process exited with code ' + code);
		//if (ffmpeg.pid === this.pid) 
		delete ffmpeg;
		ffmpeg = undefined;
	});

		break;
		case 'off':
			if (ffmpeg) {
				ffmpeg.kill('SIGHUP');
			}
			break;
		default:
		break;
	}
}

/////////////////////////// End of video


var irw = spawn('irw');

irw.stdout.on('data', function (stdout) {
	var o = stdout.toString();
	//console.log(o);
	console.log("irw_stdout:" + o);
	if (o.indexOf(' tv_power_off ') > 1) {
		relay1off();
		return;
	}
	if (o.indexOf(' tv_power ') > 1) {
		relay1on();
		return;
	}
	if (o.indexOf(' setTopBox_power_off ') > 1) {
		relay2off();
		return;
	}
	if (o.indexOf(' setTopBox_power ') > 1) {
		relay2on();
		return;
	}
});

irw.stderr.on('data', function (stderr) {
	console.log("irw_stderr:" + stderr);
});

irw.on('close', function (code) {

});


// end of file 


