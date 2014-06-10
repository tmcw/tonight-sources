var queue = require('queue-async'),
    moment = require('moment'),
    cheerio = require('cheerio');

var LIMIT = 3;

/**
 * CACHE: save results to disk
 * MOCK: use results on disk
 */
if (process.env.SAVE) request = require('../lib/request-save');
else if (process.env.MOCK) request = require('../lib/request-cached');
else request = require('request');

var ENDPOINT = 'http://www.ustreetmusichall.com/calendar/';
var VENUEID = 'ustreet';

// request(ENDPOINT, onload);
module.exports.load = function(callback) {
    request(ENDPOINT, function(err, response, body) {
        if (err) throw err;
        processBody(body, callback);
    });
}

module.exports.load(function(err, res) {
    process.stdout.write(JSON.stringify(res, null, 2));
});

function processBody(body, callback) {

    var $ = cheerio.load(body);
    var links = [];

    $('#page-content h1.headliners a').each(function(i, elem) {
        links.push('http://www.ustreetmusichall.com' + $(elem).attr('href'));
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
        if (err) throw err;
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
        title = $('.event-info h1.headliners').text().trim(),
        date = $('.event-info h2.dates').first().text();

    $('.showinfo table tr').each(function(i, tr) {
        var time = [];
        $('td', tr).each(function(i, td) {
            time.push($(td).text().trim());
        });
        times.push(time);
    });

    var prices = $('h3.price-range').text().trim();

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

    var href = $('a.tickets').attr('href');
    if (href.match(/ticketfly/g)) {
        tickets = href;
    }

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
        prices: parsePrices(prices),
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
    var abbreviations = {
        adv: 'advance',
        dos: 'door'
    };
    if (str.match(/free/i)) {
        return [{
            price: 0,
            type: 'any'
        }];
    }
    var match = str.match(/\$([\d\.]+)/);
    if (match) {
        var price = parseFloat(match[1]);
        return [{
            price: price,
            type: 'advance'
        }];
    }

    return [];
}

function parseShow(show) {
    var data = parseShowBody(show.body);
    data.url = show.url;
    return data;
}
