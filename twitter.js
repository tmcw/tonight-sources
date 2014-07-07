var Twit = require('twit'),
    moment = require('moment'),
    sourceMap = require('./').sourceMap,
    AWS = require('aws-sdk');

var T = new Twit({
    consumer_key: process.env.DCTN_TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.DCTN_TWITTER_CONSUMER_SECRET,
    access_token: process.env.DCTN_TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.DCTN_TWITTER_ACCESS_TOKEN_SECRET
});

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

var bucketConfig = { params: { Bucket: 'dctn' } },
    s3bucket = new AWS.S3(bucketConfig);

function todayStamp() {
    return moment().format('YYYY-MM-DD') + '.json';
}

var key = todayStamp();

s3bucket.getObject({
    Key: key
}, function(err, data) {
    var parsed = JSON.parse(data.Body);
    var titles = parsed.map(function(show) {
        var formatted = '';
        if (show.times && show.times.length) {
          var firstTime = show.times[0];
          var t = moment(firstTime.stamp).zone(0);
          formatted = (t.minutes() ? t.format('h:mm') : t.format('h')) + ' ';
        }
        var twit = sourceMap[show.venue_id].properties.twitter;
        if (twit) {
            twit = ' @' + twit;
        } else {
            twit = ' /' + sourceMap[show.venue_id].properties.shortname;
        }
        return formatted + show.title + twit;
    }).join(', ');
    tweet('TONIGHT: ' + titles);
});

function tweet(msg) {
    T.post('statuses/update', { status: msg }, function(err, data, response) {
        console.log(arguments)
    });
}
