/* todo:
successful IRDA 
voice control:  http://www.raspberrypi.org/meet-jasper-open-source-voice-computing/
TTS: http://elinux.org/RPi_Text_to_Speech_(Speech_Synthesis)
to write to log files only if status changes
//to read all gpio status by using gpio readall 
to query all significient events 
to startup automatically (/etc/rc.local is now fail)
//to exec gpio at once to save CPU loading
//to shutdown -r now when disconnected for a long time
//to auto-off relay in predefined period
*/

// list of argv
process.argv.forEach(function (val, index, array) {
  console.log( ' argv' + index + ': ' + val + " " );
});

// to require some nodejs packages
var util = require('util');
var http = require("http");
var exec = require('child_process').exec;

var reg = [];
for (var i = 0; i<10; i++) {
  reg[i] = 0;
}

var status = {}; //system status 
status.relay1countdown = status.relay2countdown = 0;

var counter = 0;
var server = http.createServer(function(request, response) {

         if (request.url === '/relay1on') {
    relay1on();
  } else if (request.url === '/relay1off') {
    relay1off();
  } else if (request.url === '/relay1countdown') {
    status.relay1countdown += 10;
  } else if (request.url === '/relay2on') {
    relay2on();
  } else if (request.url === '/relay2off') {
    relay2off();
  } else if (request.url === '/relay2countdown') {
    status.relay2countdown += 10;
  } else {
  }

  response.writeHead(200, {"Content-Type": "text/html"});
  response.write("<!DOCTYPE html>");
  response.write("<html>");
  response.write("<head>\n");
  response.write("<title>Kay's Page</title>\n");
  response.write('<META HTTP-EQUIV="Refresh" CONTENT="3; URL=/">');
  response.write('<meta name="viewport" content="width=400">\n');
  response.write("</head>\n");
  response.write("<body>");
  response.write("Hello Kay! " + (++counter) + "<br/>");

  for (var i = 0 ; i<10; i++){
    if(request.url === '/' + i) {
      reg[i]++; 
    }
  }

  response.write("Humidity:" + status.humidity + "%; Temperature:" + status.temperature + "&deg;C <br/>");

  response.write('<span style="font-size:34px;">');

  var command2 = ["power-off", "power-on", "to23", "to24", "to25", "to26", "to27"];
  for (key in command2){
    response.write('<a href="' + key + '">' + command2[key] + ' </a>' + reg[key] + '<br/>');
  }

  console.log("request.url:" + request.url + " command2:" + command2[request.url.substring(1)] + " typeof:" + typeof command2[request.url.substring(1)]);

  if (status.relay1 == '1') response.write('fan: <a href=relay1on>on</a> off ');
  else if (status.relay1 == '0') response.write('fan: on <a href=relay1off>off</a> ');
  else {}
  response.write('<a href=relay1countdown>[' + status.relay1countdown + ']</a><br/>');

  if (status.relay2 == '1') response.write('lamp: <a href=relay2on>on</a> off ');
  else if (status.relay2 == '0') response.write('lamp: on <a href=relay2off>off</a> ');
  else {}
  response.write('<a href=relay2countdown>[' + status.relay2countdown + ']</a><br/>');

  response.write('</span>');
  response.write("<br/>requested url: " + request.url + " ");

  response.write("</body>");
  response.write("</html>");
  response.end();

  //for ( var key in request ) {
  //  console.log(key + " " + (typeof key) );
  //}
  
  //console.log("----------------------"); //dump request for debug
  //console.log(util.inspect(request, false, null)); //dump request for debug 

}).listen(8080, function(data){
  console.log("Server is listening");
  console.log(data);
});

// to countdown 
setInterval(function () {
  if (! status.relay1countdown) {
    status.relay1countdown = 0;
  } else if (status.relay1countdown > 1) {
    status.relay1countdown--;
  } else if (status.relay1countdown = 1) {
    status.relay1countdown--;
    if (status.relay1 === '1') relay1on();
    else if (status.relay1 === '0') relay1off();
    else {}
  } else {}

  if (! status.relay2countdown) {
    status.relay2countdown = 0;
  } else if (status.relay2countdown > 1) {
    status.relay2countdown--;
  } else if (status.relay2countdown = 1) {
    status.relay2countdown--;
    if (status.relay2 === '1') relay2on();
    else if (status.relay2 === '0') relay2off();
    else {}
  } else {}
}, 1000 * 60 );

// to read humidity and temperature periodically
var counter2 =0;
var missed =0;
setInterval(function() {
  counter2++;
  var output="";
  exec("loldht 7 | grep Temp ", function (error, stdout, stderr) {
    try {
      if (stderr) {
        var output = JSON.parse(stderr); // stderr 
      } else {
        var output = JSON.parse(stdout); // stdout
      }
      status.humidity = output.Humidity;
      status.temperature = output.Temperature;
      status.timestamp = getDateTime();
    } catch(err) {
      console.log('stdout: ' + stdout);
      console.log('wrong: ' + err + "\n\n" + err.message);
      console.log('stderr: ' + stderr);
      missed++;
    }

    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
}, 1000 * 11);

// to read sensors periodically: flame, PIR
setInterval(function(){
  exec("gpio read 29 ; gpio read 25 ; gpio read 22 ; gpio read 26  ", function(error, stdout, stderr) {
    //22 relay1, 26 relay2, 
    //console.log(stdout); //output of gpio status 
    var gpioarr = stdout.split("");
    gpioarr.forEach(function (val, index, array) {
      if(index === 0) status.PIR = val.replace(/\n$/, '');
      if(index === 2) status.flame = val.replace(/\n$/, '');
      if(index === 4) status.relay1 = val.replace(/\n$/, '');
      if(index === 6) status.relay2 = val.replace(/\n$/, '');
      //console.log(" index:" + index + " val:" + val.replace(/\n$/, '') + " ");
    });
  });
  
  LOG(counter2 + " " + missed + " H" + status.humidity + " T" + status.temperature 
  + " " + getDateTime()  
  + " PIR" + status.PIR + " flame" + status.flame 
  + " relay1:" + status.relay1 + " relay2:" + status.relay2 
  + " " + status.restartWifiCount + "net:" + status.internet
  + " nDC" + status.networkDisconnectedCount
  + " status.PIRdelay" + status.PIRdelay + " ");

}, 700 );

/* //to check connection of wifi periodically, to reconnect if disconnected
setInterval(function(){
  exec("ping -c 1 google.com ", function(error, stdout, stderr){
    if(stderr){
      status.internet="disconnected";
      if(status.networkDisconnectedCount>10 ){
        exec("ifdown --force wlan0 ; ifup wlan0", function(error, stdout, stderr){});
        status.networkDisconnectedCount=0;
        if(typeof status.restartWifiCount === 'undefined'){
          status.restartWifiCount=0;
        } else {
          status.restartWifiCount++;
        }
      } else {
        status.networkDisconnectedCount++;
      }
    } else {
      status.internet="connected";
      status.networkDisconnectedCount=0;
    } 
  });
},1000 * 60);
*/

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

// to write a LOG file
var fs = require('fs');
var LOG = function (string) {
  try {
    fs.appendFile("./LOG.txt", string + "\n", function(err) {
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

// end of file 
