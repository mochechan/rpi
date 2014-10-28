/* todo:
relay1 supports temperature and countdown mode
PIR hardware adjust
successful IRDA 
voice control:  http://www.raspberrypi.org/meet-jasper-open-source-voice-computing/
TTS: http://elinux.org/RPi_Text_to_Speech_(Speech_Synthesis)
to write to log files only if status changes
to countdown with seconds
//to read all gpio status by using gpio readall 
to query all significient events 
to startup automatically (/etc/rc.local is now fail)
//to exec gpio at once to save CPU loading
//to shutdown -r now when disconnected for a long time
//to auto-off relay in predefined period
*/

console.log(global);
console.log(process);
console.log(module);


// list of argv
process.argv.forEach(function (val, index, array) {
  console.log( ' argv' + index + ': ' + val + " " );
});

// to require some nodejs packages
var util = require('util');
var http = require("http");
var exec = require('child_process').exec;
var sockjs = require('sockjs'); // for web socket
var node_static = require('node-static'); // for index.html

var status = {};
status.relay1countdown = status.relay2countdown = 0;
status.internetConnectSucc = status.internetConnectFail = 0;

// Clients list
var clients = {};

// Broadcast to all clients
function broadcast(message){
  // iterate through each client in clients object
  for (var client in clients){
    // send the message to that client
    clients[client].write(JSON.stringify(message));
  }
}


// create sockjs server
var echo = sockjs.createServer();

// on new connection event
echo.on('connection', function(conn) {
  console.log("conn ");
  console.log(conn);

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
    } else if (msg.request === "relay2mode") {
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
var server = http.createServer();

// 2. Static files server
var static_directory = new node_static.Server(__dirname);
server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
});
server.addListener('upgrade', function(req,res){
    res.end();
});

// Integrate SockJS and listen on /echo
echo.installHandlers(server, {prefix:'/echo'});

// Start server
server.listen(8080, '0.0.0.0');

// to read humidity and temperature periodically
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

  exec("ping -c 1 google.com ", function(error, stdout, stderr){
    if(error || stderr){
      status.internetConnectFail++;
    } else {
      status.internetConnectSucc++;
    } 
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
    else {}
  } else {}

  var reply ={};
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

  broadcast(status);
  LOG(status);
}, 1000 );

// to initiate GPIO pins 
exec("gpio mode 29 in ; gpio mode 25 in ; gpio mode 22 out ; gpio mode 26 out ", function(error, stdout, stderr) {
  console.log(stdout);
});

function relay1on () {
  exec("gpio write 22 0", function (error, stdout, stderr) {});
  status.relay1countdown = 0;
}

function relay1off () {
  exec("gpio write 22 1", function (error, stdout, stderr) {});
  status.relay1countdown = 0;
}

function relay2on () {
  exec("gpio write 26 0", function (error, stdout, stderr) {});
  status.relay2countdown = 0;
}

function relay2off () {
  exec("gpio write 26 1", function (error, stdout, stderr) {});
  status.relay2countdown = 0;
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
var prevStatus = {}; //
var fs = require('fs');
var LOG = function (obj) {
  if ( status.relay1 === prevStatus.relay1 && status.relay2 === prevStatus.relay2 && status.relay1mode === prevStatus.relay1mode
    && status.PIR === prevStatus.PIR && status.flame === prevStatus.flame 
    && status.humidity === prevStatus.humidity && status.temperature === prevStatus.temperature ) {
  } else {
    prevStatus = clone(status);
    var string = JSON.stringify(obj);
    try {
      fs.appendFile("./LOG2.txt", string + "\n", function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("LOGed:" + string);
        }
      }); 
    } catch (err) {
      if (err) console.log(err);
    } 
  }
}


// end of file 
