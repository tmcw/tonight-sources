var queue = require('queue-async'),
    moment = require('moment'),
    assert = require('assert'),
    cheerio = require('cheerio');

/**
 * CACHE: save results to disk
 * MOCK: use results on disk
 */
if (process.env.SAVE) request = require('../lib/request-save');
else if (process.env.MOCK) request = require('../lib/request-cached');
else request = require('request');

var ENDPOINT = 'http://www.blackcatdc.com/schedule.html';
var VENUEID = 'blackcat';

var LIMIT = 3;

// request(ENDPOINT, onload);
//
module.exports.load = function(callback) {
    request(ENDPOINT, function(err, response, body) {
        if (err) throw err;
        processBody(body, callback);
    });
}

function processBody(body, callback) {

    var $ = cheerio.load(body);
    var links = [];

    $('#main-calendar .show-details h1 a').each(function(i, elem) {
        links.push($(elem).attr('href'));
    });

    if (LIMIT) links = links.slice(0, LIMIT);

    console.error(links);
    var q = queue(1);
    links.forEach(function(link) {
        q.defer(getShow, link);
    });

    q.awaitAll(function(err, res) {
        var events = res.map(parseShow);
        callback(null, events);
    });
}

function getShow(link, callback) {
    console.error('getting', link);
    request(link, showload);

    function showload(err, response, body) {
        callback(null, {
            body: body,
            url: link
        });
    }
}

module.exports.parseShowBody = parseShowBody;

function parseShowBody(body) {
    var $ = cheerio.load(body),
        title = $('.show-details h1').text().trim(),
        date = $('.show-details h2.date').first().text();

    var costStageDoors = $('.show-text').text().trim().split('/');

    var prices = parsePrices(costStageDoors);
    var times = parseTimes(costStageDoors);

    var minage = null;

    if ($('#show-feature').text().match(/21\+/)) {
        minage = 21;
    }

    var youtube = [],
        soundcloud = [];

    $('#show-feature iframe').each(function(i, elem) {
        var iframesrc = $(elem).attr('src');
        if (iframesrc.match(/youtube/)) youtube.push(iframesrc);
        if (iframesrc.match(/soundcloud/)) soundcloud.push(iframesrc);
    });

    var tickets = null;

    $('.show-details a').each(function(i, elem) {
        var href = $(elem).attr('href');
        if (href && href.match(/ticketfly/g)) {
            tickets = href;
        }
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
        soundcloud: soundcloud,
        venue_id: VENUEID
    };
}

module.exports.parsePrices = parsePrices;

function parsePrices(segs) {
    var prices = [];

    segs.forEach(function(str) {
        if (str.match(/free/)) {
            prices.push({
                doors: 'free'
            });
        }
        var match = str.match(/\$([\d\.]+)\s(\w+)/);
        if (!match) return undefined;
        var price = match[1] === 'free' ? 'free' : parseFloat(match[1]);
        var type = match[2];
        if (type === 'Adv') type = 'advance';
        if (type === 'DOS') type = 'doors';

        prices.push({
            type: type,
            price: price
        });
    });

    return prices;
}

function parseTimes(segs) {
    var times = [];
    segs.forEach(function(str) {
        var match = str.match(/(\d+:\d+)/);
        if (match) {
            times.push(['doors', match[1] + 'pm']);
        }
    });
    return times;
}

function parseShow(show) {
    var data = parseShowBody(show.body);
    data.url = show.url;
    return data;
}
