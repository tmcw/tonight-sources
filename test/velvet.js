var test = require('tap').test,
    fixture = require('./lib/fixture'),
    glob = require('glob'),
    velvet = require('../sources/velvetlounge');

test('velvet parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/velvet/*.html').forEach(function(file) {
        fixture.flat(t, file, velvet.processBody);
    });
    t.end();
});
