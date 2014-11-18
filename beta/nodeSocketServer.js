require('net').createServer(function (socket) {
  console.log("connected");

  socket.on('data', function (data) {
    console.log('on data');
    console.log(data.toString());
    socket.write((parseInt(data.toString())+1).toString());
  });

  socket.on('connect', function (data) {
    console.log('on connect');
  });

  socket.on('end', function (data) {
    console.log('on end');
  });

  socket.on('timeout', function (data) {
    console.log('timeout');
  });

  socket.on('drain', function (data) {
    console.log('drain');
  });

  socket.on('error', function (data) {
    console.log('on error');
  });

  socket.on('close', function (data) {
    console.log('on close');
  });

}).listen(9999);
