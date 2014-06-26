var VENUEID = 'sixthandi';

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

var ENDPOINT = 'http://www.sixthandi.org/events/category/arts-entertainment/upcoming/';

module.exports.load = function(callback) {
    debug('startup');
    request(ENDPOINT, function(err, response, body) {
        debug('loaded');
        if (err) throw err;
        callback(null, processBody(body));
    });
}

module.exports.load(function(err, res) {
    console.error(JSON.stringify(res, null, 2));
});

function processBody(body) {
    var $ = cheerio.load(body);

    var res = $('.tribe-events-loop .event-list-item');
    var events = [];

    res.each(function(i, elem) {
        events.push(parseShowBody($, elem));
    });

    return events;
}

module.exports.parseShowBody = parseShowBody;
module.exports.processBody = processBody;

function parseShowBody($, elem) {
    var title = $('.event-content-wrap h2', elem).text().trim(),
        support = $('.event-content-wrap h3', elem).text().trim(),
        date = $('.time-details', elem).text().trim();


    var details = $('.event-list-details .event-details-wrap dl', elem);

    var detObj = {};
    var thisPt;
    $('dd, dt', details).each(function(i, elem) {
        if (elem.name === 'dt') thisPt = $(elem).text().trim();
        else {
            detObj[thisPt] = $(elem).text().trim();
        }
    });

    var prices = [];
    var times = [];
    var minage = [];

    var youtube = [],
        soundcloud = [];

    var tickets = null;

    $('a', elem).each(function(i, elem) {
        var href = $(elem).attr('href') || '';
        if (href.match(/ticketfly/)) tickets = href;
    });

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
        supporters: [support],
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
