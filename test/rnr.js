var test = require('tap').test,
    fixture = require('./lib/fixture'),
    glob = require('glob'),
    rnr = require('../sources/rockandroll');

test('rnr parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/rnr/*.html').forEach(function(file) {
        fixture(t, file, rnr.parseShowBody);
    });
    t.end();
});
