var test = require('tap').test,
    fixture = require('./lib/fixture'),
    glob = require('glob'),
    dc9 = require('../sources/dc9');

test('dc9 parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/dc9/*.html').forEach(function(file) {
        fixture(t, file, dc9.parseShowBody);
    });
    t.end();
});
