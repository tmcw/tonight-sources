var VENUEID = 'velvetlounge';

var queue = require('queue-async'),
    moment = require('moment'),
    debug = require('debug')(VENUEID),
    assert = require('assert'),
    cheerio = require('cheerio');

/**
 * CACHE: save results to disk
 * MOCK: use results on disk
 */
if (process.env.SAVE) request = require('../lib/request-save');
else if (process.env.MOCK) request = require('../lib/request-cached');
else request = require('request');

var ENDPOINT = 'https://graph.facebook.com/hitsdc/events?access_token=' + process.env.FBAPI_TOKEN;

module.exports.load = function(callback) {
    debug('startup');
    request(ENDPOINT, function(err, response, body) {
        debug('loaded');
        // console.log(body);
        if (err) throw err;
        callback(null, processBody(JSON.parse(body)));
    });
}

module.exports.load(function(err, res) {
    console.error(JSON.stringify(res, null, 2));
});

function processBody(body) {
    return body.data.map(parseShowBody);
}

module.exports.parseShowBody = parseShowBody;
module.exports.processBody = processBody;

function parseShowBody(body) {
    var title = body.name;

    return {
        times: [],
        title: body.name,
        prices: [],
        date: moment(body.start_time),
        minage: [],
        tickets: [],
        venue_id: VENUEID
    };
}
