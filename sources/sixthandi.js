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
if (process.env.SAVE) {
    request = require('../lib/request-save');
} else if (process.env.MOCK) {
    request = require('../lib/request-cached')
} else {
    request = require('request');
}

var ENDPOINT = 'http://www.sixthandi.org/events/category/arts-entertainment/upcoming/';

module.exports.load = function(callback) {
    debug('startup');
    request(ENDPOINT, function(err, response, body) {
        debug('loaded');
        if (err) {
            throw err;
        }
        callback(null, processBody(body));
    });
}

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
        if (elem.name === 'dt')
            thisPt = $(elem).text().trim(); else {
            detObj[thisPt] = $(elem).text().trim();
        }
    });

    var prices = [],
        soldout = false;

    if (detObj['Admission:']) {
        if (detObj['Admission:'].match(/SOLD OUT/)) {
            soldout = true;
        }
        var pts = detObj['Admission:'].split('\n').map(function(s) {
            return s.trim();
        }).forEach(function(adm) {
            var dol = adm.match(/\$([\d\.]+)/),
                dollars = null;
            if (dol && dol.length) {
                dollars = parseInt(dol[1], 10);
            }
            if (adm.match(/in advance/g)) {
                prices.push({
                    label: 'advance',
                    price: dollars
                });
            } else if (adm.match(/day of show/g)) {
                prices.push({
                    label: 'door',
                    price: dollars
                });
            }
        });
    }

    var times = [];

    if (detObj['Date:']) {
        // Jul 30, 2014 • 7:00 pm
        var d = moment(detObj['Date:'], 'MMM DD, YYYY • hh:mm a');
        if (d.isValid()) {
            times.push({
                label: 'doors',
                stamp: +d.toDate()
            });
        }
    }

    var minage = 0;

    var youtube = [],
        soundcloud = [];

    var tickets = null;

    $('a', elem).each(function(i, elem) {
        var href = $(elem).attr('href') || '';
        if (href.match(/ticketfly/)) {
            tickets = href;
        }
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
        soldout: soldout,
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
    } else {
        return [];
    }
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
