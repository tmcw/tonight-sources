var crypto = require('crypto');

module.exports = function urlPath(url) {
    var shasum = crypto.createHash('sha1');
    shasum.update(url);
    return './cache/' + shasum.digest('hex');
};
