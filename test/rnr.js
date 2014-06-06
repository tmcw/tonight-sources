var test = require('tap').test,
    fs = require('fs'),
    glob = require('glob'),
    rnr = require('../sources/rockandroll');

function fixture(t, name, fn) {
    var resultName = name.replace('.html', '.json');
    var output = fn(fs.readFileSync(name, 'utf8'));
    if (process.env.UPDATE) {
        fs.writeFileSync(resultName, JSON.stringify(output, null, 2));
    }
    // t.ok(output.times.length, 'times');
    t.ok(output.title.length, name);
    // t.ok(output.date.length, 'date');
    t.equal(output.venue_id, 'rnr');
    t.deepEqual(output, JSON.parse(fs.readFileSync(resultName)));
}

test('rnr parseShowBody', function(t) {
    glob.sync(__dirname + '/fixture/rnr/*.html').forEach(function(file) {
        fixture(t, file, rnr.parseShowBody);
    });
    t.end();
});
