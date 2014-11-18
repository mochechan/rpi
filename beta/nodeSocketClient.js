var s = require('net').Socket();
s.connect(9999, '1.34.15.242');
//s.connect(37014, 'src.imoncloud.com');
s.write('1');

s.on('data', function(d){
  console.log("on data ");
  console.log(d.toString());
  s.write((parseInt(d.toString())+1).toString()); 
});

  s.on('connect', function (data) {
    console.log('on connect');
  });

  s.on('end', function (data) {
    console.log('on end');
  });

  s.on('timeout', function (data) {
    console.log('timeout');
  });

  s.on('drain', function (data) {
    console.log('drain');
  });

  s.on('error', function (data) {
    console.log('on error');
  });

  s.on('close', function (data) {
    console.log('on close');
  });

//s.end();

