var queue = require('queue-async'),
    moment = require('moment'),
    cheerio = require('cheerio');

/**
 * CACHE: save results to disk
 * MOCK: use results on disk
 */
if (process.env.SAVE) request = require('./request-save');
else if (process.env.MOCK) request = require('./request-cached');
else request = require('request');

var ENDPOINT = 'http://www.dcnine.com/calendar/';
var VENUEID = 'dc9';

request(ENDPOINT, onload);

function onload(err, response, body) {
    if (err) throw err;

    var $ = cheerio.load(body);
    var links = [];

    $('#content h2').each(function(i, elem) {
        links.push($('a', elem).attr('href'));
    });

    var q = queue(1);
    links.forEach(function(link) {
        q.defer(getShow, link);
    });

    q.awaitAll(function(err, res) {
        var events = res.map(parseShow);
        console.log(events);
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

function parseShow(show) {
    var $ = cheerio.load(show.body),
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

    times = times.map(function(time) {
        var rmday = date.replace(/^(\w+)\s/, '').trim();
        return {
            label: time[0],
            formatted: time[1],
            stamp: moment(rmday + ' ' + time[1], 'MMM D h:mma')
        };
    });

    var data = {
        times: times,
        title: title,
        date: date,
        url: show.url,
        venue_id: VENUEID
    };

    // console.log(JSON.stringify(data, null, 2));
    return data;
}
