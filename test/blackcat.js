var test = require('tap').test,
    fs = require('fs'),
    glob = require('glob'),
    blackcat = require('../sources/blackcat');

function fixture(t, name, fn) {
    var resultName = name.replace('.html', '.json');
    var output = fn(fs.readFileSync(name, 'utf8'));
    if (process.env.UPDATE) {
        fs.writeFileSync(resultName, JSON.stringify(output, null, 2));
    }
    t.ok(output.times.length, 'times');
    t.ok(output.title.length, 'title');
    t.ok(output.date.length, 'date');
    t.equal(output.venue_id, 'blackcat');
    t.deepEqual(output, JSON.parse(fs.readFileSync(resultName)));
}

test('blackcat parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/blackcat/*.html').forEach(function(file) {
        fixture(t, file, blackcat.parseShowBody);
    });
    t.end();
});
