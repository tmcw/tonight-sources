var fs = require('fs');

module.exports = function fixture(t, name, fn) {
    var resultName = name.replace('.html', '.json');
    var output = fn(fs.readFileSync(name, 'utf8'));
    if (process.env.UPDATE) {
        fs.writeFileSync(resultName, JSON.stringify(output, null, 2));
    }
    t.ok(output.times.length, 'times');
    output.times.forEach(function(time) {
        t.ok(time.stamp, 'time has stamp');
        t.ok(time.label, 'time has label');
    });
    t.ok(output.prices, 'prices');
    output.prices.forEach(function(price) {
        t.equal(typeof price.type, 'string');
        t.equal(typeof price.price, 'number');
    });
    t.ok(output.title.length, 'title');
    t.ok(output.date.length, 'date');
    t.deepEqual(output, JSON.parse(fs.readFileSync(resultName)));
}

module.exports.flat = function fixture(t, name, fn) {
    var resultName = name.replace('.html', '.json');
    var outputs = fn(fs.readFileSync(name, 'utf8'));
    if (process.env.UPDATE) {
        fs.writeFileSync(resultName, JSON.stringify(outputs, null, 2));
    }
    t.deepEqual(outputs, JSON.parse(fs.readFileSync(resultName)));
    outputs.forEach(function(output) {
        t.ok(output.times.length, 'times');
        output.times.forEach(function(time) {
            t.ok(time.stamp, 'time has stamp');
            t.ok(time.label, 'time has label');
        });
        t.ok(output.prices, 'prices');
        output.prices.forEach(function(price) {
            t.equal(typeof price.type, 'string');
            t.equal(typeof price.price, 'number');
        });
        t.ok(output.title.length, 'title');
        t.ok(output.date.length, 'date');
    });
}
