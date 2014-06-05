var test = require('tap').test,
    fs = require('fs'),
    glob = require('glob'),
    dc9 = require('../sources/dc9');

function fixture(t, name, fn) {
    var resultName = name.replace('.html', '.json');
    var output = fn(fs.readFileSync(name, 'utf8'));
    if (process.env.UPDATE) {
        fs.writeFileSync(resultName, JSON.stringify(output, null, 2));
    }
    t.ok(output.times.length, 'times');
    t.ok(output.title.length, 'title');
    t.ok(output.date.length, 'date');
    t.equal(output.venue_id, 'dc9');
    t.deepEqual(output, JSON.parse(fs.readFileSync(resultName)));
}

test('dc9 parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/dc9/*.html').forEach(function(file) {
        fixture(t, file, dc9.parseShowBody);
    });
    t.end();
});
