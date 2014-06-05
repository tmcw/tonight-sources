var fs = require('fs'),
    request = require('request'),
    urlPath = require('./url-path');

module.exports = function(url, cb) {
    console.log(url);
    request(url, function(err, response, body) {
        if (err) throw err;
        fs.writeFileSync(urlPath(url), body)
        cb(err, response, body);
    });
};
