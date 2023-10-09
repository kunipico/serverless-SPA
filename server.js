const connect  = require('connect');
const static = require('serve-static');

const server = connect();

server.use(static(__dirname + '/public'));
server.listen(9292);

const livereload = require('livereload');
const lrserver = livereload.createServer();
lrserver.watch(__dirname + "/public");

