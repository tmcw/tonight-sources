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

var ENDPOINT = 'http://www.dcnine.com/calendar/';
var VENUEID = 'dc9';

// request(ENDPOINT, onload);
module.exports.load = function(callback) {
    request(ENDPOINT, function(err, response, body) {
        if (err) throw err;
        processBody(body, callback);
    });
}

function processBody(body, callback) {

    var $ = cheerio.load(body);
    var links = [];

    $('#content h2').each(function(i, elem) {
        links.push($('a', elem).attr('href'));
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
        title = $('.post h2').text().trim(),
        date = $('.post h3').first().text();

    $('.showinfo table tr').each(function(i, tr) {
        var time = [];
        $('td', tr).each(function(i, td) {
            time.push($(td).text().trim());
        });
        times.push(time);
    });

    var prices = $('.showinfo h3').text().trim();

    var support = [];
    // $('#content .post > h3').each(function(i, elem) {
    //     support.push($(elem).text());
    // });

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

    $('.showinfo a').each(function(i, elem) {
        var href = $(elem).attr('href');
        if (href.match(/ticketfly/g)) {
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
        prices: parsePrices(prices),
        date: date,
        minage: minage,
        tickets: tickets,
        youtube: youtube,
        soundcloud: soundcloud,
        supporters: support,
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
    try {
        var chunked = str.split(/\s+/).map(function(chunk) {
            var match = chunk.match(/\$([\d\.]+)/);
            if (!match) throw new Error('could not parse "' + str + '"');
            var price = parseFloat(match[1]);
            var type = chunk.split('/')[1].trim();
            return {
                price: price,
                type: abbreviations[type]
            };
        });
        return chunked;
    } catch(e) {
        var price = str.match(/\$([\d\.]+)/);
        if (price) {
            var door = str.match(/door/i);
            return [{
                price: parseFloat(price[1]),
                type: door ? 'door' : 'unknown'
            }];
        } else {
            return [{
                price: str,
                type: 'unknown'
            }];
        }
    }
}

function parseShow(show) {
    var data = parseShowBody(show.body);
    data.url = show.url;
    return data;
}
