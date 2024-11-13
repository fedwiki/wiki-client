// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const sinon = require('sinon');

const simulatePageNotFound = function() {
  const xhrFor404 = {
    status: 404
  };
  return sinon.stub(jQuery, "ajax").yieldsTo('error',xhrFor404);
};

const simulatePageFound = function(pageToReturn){
  if (pageToReturn == null) { pageToReturn = {}; }
  return sinon.stub(jQuery, "ajax").yieldsTo('success', pageToReturn);
};


module.exports = {
  simulatePageNotFound,
  simulatePageFound
};
