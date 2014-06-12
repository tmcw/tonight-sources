var test = require('tap').test,
    fs = require('fs'),
    glob = require('glob'),
    ninethirty = require('../sources/930');

function fixture(t, name, fn) {
    var resultName = name.replace('.html', '.json');
    var output = fn(fs.readFileSync(name, 'utf8'));
    if (process.env.UPDATE) {
        fs.writeFileSync(resultName, JSON.stringify(output, null, 2));
    }
    // t.ok(output.times.length, 'times');
    // t.ok(output.title.length, 'title');
    // t.ok(output.date.length, 'date');
    t.equal(output.venue_id, '930');
    t.deepEqual(output, JSON.parse(fs.readFileSync(resultName)));
}

test('930 parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/930/*.html').forEach(function(file) {
        fixture(t, file, ninethirty.parseShowBody);
    });
    t.end();
});
