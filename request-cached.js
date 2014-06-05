var fs = require('fs'),
    urlPath = require('./url-path');

module.exports = function(url, cb) {
    cb(null, null, fs.readFileSync(urlPath(url), 'utf8'));
};
