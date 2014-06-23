var http = require('http');

var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('tonight-source worker.');
});

server.listen(process.env.PORT || 3000);
