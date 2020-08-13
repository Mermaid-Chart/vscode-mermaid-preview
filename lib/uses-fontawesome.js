const isNil = (value) => value === nil;

module.exports = (diagram) => {
  return !isNil(diagram) && !isNil(diagram.match(/fa:/));
};
