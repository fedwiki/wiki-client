const active = require('../lib/active')

describe('active', function () {
  before(function () {
    $('<div id="active1" />').appendTo('body')
    $('<div id="active2" />').appendTo('body')
    active.set($('#active1'))
  })

  it('should detect the scroll container', () => expect(active.scrollContainer).to.be.a($))

  it('should set the active div', function () {
    active.set($('#active2'))
    expect($('#active2').hasClass('active')).to.be.true
  })

  return it('should remove previous active class', () => expect($('#active1').hasClass('active')).to.be.false)
})
