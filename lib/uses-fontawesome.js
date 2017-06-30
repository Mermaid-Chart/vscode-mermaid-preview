const _ = require('lodash');

module.exports = (diagram) => {
  return !_.isNil(diagram) && !_.isNil(diagram.match(/fa:/));
};
