var xtend = require('xtend'),
    moment = require('moment');

var VENUEID = 'fortreno';

var shows = [];

var renoDefaults = {
  "prices": [{
    "price": 0,
    "type": "Day of show"
  }],
  "minage": 0,
  "venue_id": VENUEID,
  "url": "http://www.fortreno.com/",
  "youtube": [],
  "soundcloud": [],
  "supporters": [],
  "tickets": null
};

shows.push(xtend({
  "times": [{
    "time": "7:00 pm",
    "stamp": +(moment('7:00pm JULY 7 2014', 'h:mma MMM D YYYY').toDate()),
    "label": "SHOW"
  }],
  "title": "CAPTIVATORS & Malatese",
  "date": "MONDAY, JULY 7 2014"
}, renoDefaults));

shows.push(xtend({
  "times": [{
    "time": "7:00 pm",
    "stamp": +(moment('7:00pm JULY 10 2014', 'h:mma MMM D YYYY').toDate()),
    "label": "SHOW"
  }],
  "title": "Peanut Butter & Dave + Golden Looks + Calavera Skull",
  "date": "THURSDAY, JULY 10 2014"
}, renoDefaults));

shows.push(xtend({
  "times": [{
    "time": "7:00 pm",
    "stamp": +(moment('7:00pm JULY 14 2014', 'h:mma MMM D YYYY').toDate()),
    "label": "SHOW"
  }],
  "title": "BABY BRY BRY & THE APOLOGISTS + ALONERS + TIGER HORSE",
  "date": "THURSDAY, JULY 14 2014"
}, renoDefaults));

shows.push(xtend({
  "times": [{
    "time": "7:00 pm",
    "stamp": +(moment('7:00pm JULY 17 2014', 'h:mma MMM D YYYY').toDate()),
    "label": "SHOW"
  }],
  "title": "PRIESTS + SOTANO + PUFF PIECES",
  "date": "THURSDAY, JULY 17 2014"
}, renoDefaults));

shows.push(xtend({
  "times": [{
    "time": "7:00 pm",
    "stamp": +(moment('7:00pm JULY 21 2014', 'h:mma MMM D YYYY').toDate()),
    "label": "SHOW"
  }],
  "title": "ALARMS & CONTROLS + TALK IT + DISSONANCE",
  "date": "THURSDAY, JULY 21 2014"
}, renoDefaults));

shows.push(xtend({
  "times": [{
    "time": "7:00 pm",
    "stamp": +(moment('7:00pm JULY 24 2014', 'h:mma MMM D YYYY').toDate()),
    "label": "SHOW"
  }],
  "title": "TITLE TRACKS + THE EFFECTS + MYRRH MYRRH",
  "date": "THURSDAY, JULY 24 2014"
}, renoDefaults));


shows.push(xtend({
  "times": [{
    "time": "7:00 pm",
    "stamp": +(moment('7:00pm JULY 29 2014', 'h:mma MMM D YYYY').toDate()),
    "label": "SHOW"
  }],
  "title": "BLACK SPARKS + STEREOSLEEP + THE RAISED BY WOLVES",
  "date": "THURSDAY, JULY 28 2014"
}, renoDefaults));

shows.push(xtend({
  "times": [{
    "time": "7:00 pm",
    "stamp": +(moment('7:00pm JULY 31 2014', 'h:mma MMM D YYYY').toDate()),
    "label": "SHOW"
  }],
  "title": "GIVE + PROTECT U",
  "date": "THURSDAY, JULY 31 2014"
}, renoDefaults));

module.exports.load = function(callback) {
    callback(null, shows);
};
