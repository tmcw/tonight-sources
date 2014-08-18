var VENUEID = 'lincoln';

var queue = require('queue-async'),
    moment = require('moment'),
    debug = require('debug')(VENUEID),
    cheerio = require('cheerio');

var mylimit = process.env.LIMIT || 5;

/**
 * CACHE: save results to disk
 * MOCK: use results on disk
 */
if (process.env.SAVE) request = require('../lib/request-save');
else if (process.env.MOCK) request = require('../lib/request-cached');
else request = require('request');

var ENDPOINT = 'http://www.thelincolndc.com/calendar/';

request(ENDPOINT, function( err, response, body ){
    debug( 'loaded' );
    if ( err ) throw err;
    processBody( body );
});

function processBody(body, callback) {
    var $ = cheerio.load(body);
    var links = [];

    $('.headliners.summary a').each(function(i, elem) {
        links.push('http://www.thelincolndc.com' + $(elem).attr('href'));
    });

    if (mylimit) links = links.slice(0, mylimit);

    var q = queue(process.env.SOURCE_CONCURRENCY || 1);

    links.forEach(function(link) {
        q.defer(getShow, link);
    });

    q.awaitAll(function(err, res) {
        if (err) return callback(err);
        var events = res.map(parseShow);
        console.log( events );
        // callback(null, events);
    });
}

function getShow(link, callback) {
    debug('getting ', link);
    request(link, showload);

    function showload(err, response, body) {
        if (err) {
            debug('err' + err);
            return callback(err);
        }
        callback(null, {
            body: body,
            url: link
        });
    }
}

function parseShowBody(body) {
    var $ = cheerio.load(body),
        time = $('.times .doors').text().split('Doors: ')[1],
        title = $('.headliners summary').text().trim(),
        date = $('h2.dates').text(),
        prices = $('.price-range').text();

    var prices = $('h3.price-range').text().trim();
    var minage = null;
    var tickets = null;

    var href = $('a.tickets').attr('href');
    if (href && href.match(/ticketfly/g)) {
        tickets = href;
    }

    var soldout = false;
    if ( $('.sold-out').length > 0 ) {
        soldout = true;
    }

    function toMoment() {
        var momentInTime = moment(date + '-' + time,'dddd, MMMM D, YYYY-ha');
        return momentInTime;
    }
    
    var times = function() {
        return {
            label: time,
            formatted: toMoment().format('MMM D h:mma'),
            stamp: toMoment().toDate()
        };
    };

    return {
        times: times(),
        title: title,
        prices: parsePrices( prices ),
        date: date,
        minage: minage,
        tickets: tickets,
        venue_id: VENUEID
    };
}

function parsePrices( str ) {
    // has a price range
    if ( str.indexOf('-') > 0 ) {
        var price = str.replace(/(\$)/g, '').split(' - ');
        return {
            min: parseInt( price[0] ),
            max: parseInt( price[1] )
        }
    } else {
        return str.replace(/(\$)/g, '');
    }
}

function parseShow(show) {
    var data = parseShowBody(show.body);
    data.url = show.url;
    return data;
}
