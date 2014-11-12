var s = require('net').Socket();
s.connect(9999,'127.0.0.1');
s.write('Hello');
s.end();
