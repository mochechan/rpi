var exec = require('child_process').exec;

var status = {};
var clients = {}; // Clients list

// Broadcast to all clients
function broadcast(message){
  for (var client in clients) clients[client].write(JSON.stringify(message));
}
setInterval(function(){
	broadcast(new Date());
},500);


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
    //console.log("on data " + conn.id + message);
    var msg = JSON.parse(message);
	console.log(msg);
	switch (msg.require) {
		case 'forward':
			exec("gpio write 10 1");
			exec("gpio write 14 1");
		break;
		case 'forward_stop':
			exec("gpio write 10 0");
			exec("gpio write 14 0");
		break;
		case 'backward':
			exec("gpio write 6 1");
			exec("gpio write 11 1");
		break;
		case 'backward_stop':
			exec("gpio write 6 0");
			exec("gpio write 11 0");
		break;
		case 'left_forward':
			exec("gpio write 14 1");
		break;
		case 'left_forward_stop':
			exec("gpio write 14 0");
		break;
		case 'left_backward':
			exec("gpio write 6 1");
		break;
		case 'left_backward_stop':
			exec("gpio write 6 0");
		break;
		case 'right_forward':
			exec("gpio write 10 1");
		break;
		case 'right_forward_stop':
			exec("gpio write 10 0");
		break;
		case 'right_backward':
			exec("gpio write 11 1");
		break;
		case 'right_backward_stop':
			exec("gpio write 11 0");
		break;
		case 'stop':
			exec("gpio write 6 0");
			exec("gpio write 10 0");
			exec("gpio write 11 0");
			exec("gpio write 14 0");
		break;
		case 'clockwise':
			exec("gpio write 11 1");
			exec("gpio write 14 1");
		break;
		case 'counterclockwise':
			exec("gpio write 6 1");
			exec("gpio write 10 1");
		break;
		default:
		break;
	}
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


// to initiate GPIO pins 
var initGPIO = "gpio mode 6 out; gpio mode 10 out; gpio mode 11 out; gpio mode 14 out; gpio write 6 0; gpio write 10 0; gpio write 11 0; gpio write 14 0";
exec(initGPIO, function(error, stdout, stderr) {
  console.log(stdout);
});


// end of file 
