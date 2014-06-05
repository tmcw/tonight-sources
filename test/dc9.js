var test = require('tap').test,
    fs = require('fs'),
    dc9 = require('../sources/dc9');

function fixture(t, name, fn) {
    var resultName = name.replace('.html', '.json');
    var output = fn(fs.readFileSync(name, 'utf8'));
    if (process.env.UPDATE) {
        fs.writeFileSync(resultName, JSON.stringify(output, null, 2));
    }
    t.deepEqual(output, JSON.parse(fs.readFileSync(resultName)));
}

test('parseShowBody', function(t) {
    fixture(t, __dirname + '/fixture/dc9-show.html', dc9.parseShowBody);
    t.end();
});
