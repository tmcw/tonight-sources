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

var ENDPOINT = 'http://www.rockandrollhoteldc.com/calendar/upcoming/';
var VENUEID = 'rnr';

// request(ENDPOINT, onload);

function onload(err, response, body) {
    if (err) throw err;

    var $ = cheerio.load(body);
    var links = [];

    $('h2.tribe-events-list-event-title a').each(function(i, elem) {
        links.push($(elem).attr('href'));
    });

    var q = queue(1);
    links.forEach(function(link) {
        q.defer(getShow, link);
    });

    q.awaitAll(function(err, res) {
        var events = res.map(parseShow);
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
        title = $('.artist_title_opener_single').text().trim(),
        date = $('.artist_date-single').first().text().trim();

    var costStageDoors = $('.show-text').text().trim().split('/');

    var prices = parsePrices(costStageDoors);
    var times = [];

    $('#event-info-single .info_left>div').each(function(i, row) {
        times.push({
            time: $('.date_right', row).text().trim(),
            type: $('.date_left', row).text().trim()
        });
    });

    var prices = [];

    $('#event-info-single .info_right>div').each(function(i, row) {
        var txt = $(row).text().split('|');
        var price = txt[0].trim();
        var type = txt[1].trim();
        if (price === '$FREE') {
            price = 0;
            type = 'any';
        } else {
            price = parseFloat(price.replace('$', ''));
            if (isNaN(price)) price = null;
        }
        prices.push({
            price: price,
            type: type
        });
    });

    var minage = null;

    if ($('.artist_date-single').text().match(/21\+/)) {
        minage = 21;
    }

    var youtube = [],
        soundcloud = [];

    $('#tribe-events iframe').each(function(i, elem) {
        var iframesrc = $(elem).attr('src');
        if (iframesrc.match(/youtube/)) youtube.push(iframesrc);
        if (iframesrc.match(/soundcloud/)) soundcloud.push(iframesrc);
    });

    var tickets = null;

    $('.ticket-area a').each(function(i, elem) {
        var href = $(elem).attr('href');
        if (href && href.match(/ticketfly/g)) {
            tickets = href;
        }
    });

    // times = times.map(function(time) {
    //     var rmday = date.replace(/^(\w+)\s/, '').trim();
    //     return {
    //         label: time.type,
    //         formatted: time.time,
    //         stamp: +moment(rmday + ' ' + time[1], 'MMM D h:mma').toDate()
    //     };
    // });

    /*
    console.log({
        times: times,
        title: title,
        prices: prices,
        date: date,
        minage: minage,
        tickets: tickets,
        youtube: youtube,
        soundcloud: soundcloud,
        venue_id: VENUEID
    });
    */

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

function parseShow(show) {
    var data = parseShowBody(show.body);
    data.url = show.url;
    return data;
}
