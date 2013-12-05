(function() {
  var simulatePageFound, simulatePageNotFound, sinon;

  sinon = require('sinon');

  simulatePageNotFound = function() {
    var xhrFor404;
    xhrFor404 = {
      status: 404
    };
    return sinon.stub(jQuery, "ajax").yieldsTo('error', xhrFor404);
  };

  simulatePageFound = function(pageToReturn) {
    if (pageToReturn == null) {
      pageToReturn = {};
    }
    return sinon.stub(jQuery, "ajax").yieldsTo('success', pageToReturn);
  };

  module.exports = {
    simulatePageNotFound: simulatePageNotFound,
    simulatePageFound: simulatePageFound
  };

}).call(this);

/*
//@ sourceMappingURL=mockServer.js.map
*/