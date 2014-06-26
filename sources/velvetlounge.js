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

var ENDPOINT = 'http://velvetloungedc.com/events/';

module.exports.load = function(callback) {
    debug('startup');
    request(ENDPOINT, function(err, response, body) {
        debug('loaded');
        if (err) throw err;
        callback(null, processBody(body));
    });
}

// module.exports.load(function(err, res) {
//     console.error(JSON.stringify(res, null, 2));
// });

function processBody(body) {
    var $ = cheerio.load(body);

    var res = $('.tribe-events-loop .hentry');
    var events = [];

    res.each(function(i, elem) {
        events.push(parseShowBody($, elem));
    });

    return events;
}

module.exports.parseShowBody = parseShowBody;
module.exports.processBody = processBody;

function parseShowBody($, elem) {
    var title = $('.custom-event-title h2', elem).text().trim(),
        date = $('.time-details', elem).text().trim();

    var costStageDoors = $('.age-restriction', elem)
        .text().trim();

    var prices = parsePrices(costStageDoors);
    var times = parseTimes(costStageDoors);
    var minage = parseMinAge(costStageDoors);

    var youtube = [],
        soundcloud = [];

    var tickets = null;

    times = times.map(function(time) {
        var rmday = date.replace(/^(\w+)\s/, '').trim();
        return {
            label: time[0],
            formatted: time[1],
            stamp: +moment(rmday + ' ' + time[1], 'MMM D h:mma').toDate()
        };
    });

    return {
        times: times,
        title: title,
        prices: prices,
        date: date,
        minage: minage,
        tickets: tickets,
        youtube: youtube,
        soundcloud: soundcloud,
        venue_id: VENUEID
    };
}

module.exports.parsePrices = parsePrices;

function parsePrices(str) {
    var price = str.match(/\$([\d\.]+)/);
    if (price) {
        return [{
            type: 'doors',
            price: parseFloat(price[1])
        }];
    } else { return []; }
}

function parseTimes(str) {
    var times = [];
    var doorsTime = str.match(/Doors (\d+(:\d+)?)/);
    if (doorsTime) {
        times.push(['doors', doorsTime[1] + 'pm']);
    }
    var showTime = str.match(/Show (\d+(:\d+)?)/);
    if (showTime) {
        times.push(['show', showTime[1] + 'pm']);
    }
    return times;
}

function parseMinAge(str) {
    var minAge = str.match(/(\d+)\+/);
    if (minAge) return parseInt(minAge[1], 10);
    else return null;
}

function parseShow(show) {
    var data = parseShowBody(show.body);
    data.url = show.url;
    return data;
}
