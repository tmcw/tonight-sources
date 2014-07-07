module.exports.sources = require('./sources');

module.exports.sourceMap = sourceMap = {};

module.exports.sources.features.forEach(function(feat) {
  sourceMap[feat.properties.id] = feat;
});
