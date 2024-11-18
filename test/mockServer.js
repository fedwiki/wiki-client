const sinon = require('sinon')

const simulatePageNotFound = function () {
  const xhrFor404 = {
    status: 404,
  }
  sinon.stub(jQuery, 'ajax').yieldsTo('error', xhrFor404)
}

const simulatePageFound = function (pageToReturn) {
  if (pageToReturn == null) {
    pageToReturn = {}
  }
  sinon.stub(jQuery, 'ajax').yieldsTo('success', pageToReturn)
}

module.exports = {
  simulatePageNotFound,
  simulatePageFound,
}
