var queue = require('queue-async'),
    moment = require('moment'),
    cheerio = require('cheerio');

var LIMIT = 10;

/**
 * CACHE: save results to disk
 * MOCK: use results on disk
 */
if (process.env.SAVE) request = require('../lib/request-save');
else if (process.env.MOCK) request = require('../lib/request-cached');
else request = require('request');

var ENDPOINT = 'http://www.930.com/concerts/';
var VENUEID = '930';

module.exports.load = function(callback) {
    request(ENDPOINT, function(err, response, body) {
        if (err) throw err;
        processBody(body, callback);
    });
}

// module.exports.load(function(err, resp) {
//     console.log(JSON.stringify(resp, null, 2));
// });

function processBody(body, callback) {

    var $ = cheerio.load(body);
    var links = [];

    $('#content .list-view-details h1').each(function(i, elem) {
        links.push('http://www.930.com' + $('a', elem).attr('href'));
    });

    if (LIMIT) links = links.slice(0, LIMIT);

    var q = queue(1);

    links.forEach(function(link) {
        console.error('getting ', link);
        q.defer(getShow, link);
    });

    q.awaitAll(function(err, res) {
        if (err) return callback(err);
        var events = res.map(parseShow);
        callback(null, events);
    });
}

function getShow(link, callback) {
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
        times = [],
        title = $('h1.headliners').text().trim(),
        date = $('h2.dates').first().text();

    $('h2.times span').each(function(i, elem) {
        var txt = $(elem).text().trim();
        if (txt.match(/Doors/)) {
            times.push({
                label: 'doors',
                stamp: +moment(date + ' ' + txt.replace(/Doors\:/, ''),'ddd MM/DD/YY  h:mm a').toDate()
            });
        }
    });

    var supports = $('h2.supports').first().text().trim();

    var prices = $('.showinfo h3').text().trim();

    var minage = null;

    if ($('.showinfo').text().match(/all ages/)) {
        minage = 0;
    } else if ($('.showinfo').text().match(/21\+/)) {
        minage = 21;
    }

    var youtube = [],
        soundcloud = [];

    $('#content iframe').each(function(i, elem) {
        var iframesrc = $(elem).attr('src');
        if (iframesrc.match(/youtube/)) youtube.push(iframesrc);
        if (iframesrc.match(/soundcloud/)) soundcloud.push(iframesrc);
    });

    var tickets = null;

    $('h3.ticket-link.primary-link a').each(function(i, elem) {
        var href = $(elem).attr('href');
        if (href.match(/ticketfly/g)) {
            tickets = href;
        }
    });

    return {
        times: times,
        title: title,
        prices: parsePrices(prices),
        date: date,
        minage: minage,
        tickets: tickets,
        youtube: youtube,
        soundcloud: soundcloud,
        supporters: [supports],
        venue_id: VENUEID
    };
}

module.exports.parsePrices = parsePrices;

function parseShow(show) {
    var data = parseShowBody(show.body);
    data.url = show.url;
    return data;
}

function parsePrices(prices) {
    return [];
}
