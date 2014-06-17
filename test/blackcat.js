var test = require('tap').test,
    fixture = require('./lib/fixture'),
    glob = require('glob'),
    blackcat = require('../sources/blackcat');

test('blackcat parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/blackcat/*.html').forEach(function(file) {
        fixture(t, file, blackcat.parseShowBody);
    });
    t.end();
});
