var test = require('tap').test,
    fixture = require('./lib/fixture'),
    glob = require('glob'),
    ninethirty = require('../sources/930');

test('930 parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/930/*.html').forEach(function(file) {
        fixture(t, file, ninethirty.parseShowBody);
    });
    t.end();
});
