/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const active = require('../lib/active');

describe('active', function() {

  before(function() {
    $('<div id="active1" />').appendTo('body');
    $('<div id="active2" />').appendTo('body');
    return active.set($('#active1'));
  });

  it('should detect the scroll container', () => expect(active.scrollContainer).to.be.a($));

  it('should set the active div', function() {
    active.set($('#active2'));
    return expect($('#active2').hasClass('active')).to.be.true;
  });

  return it('should remove previous active class', () => expect($('#active1').hasClass('active')).to.be.false);
});

