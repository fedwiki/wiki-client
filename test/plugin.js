const plugin = require('../lib/plugin')
// const sinon = require('sinon')
const expect = require('expect.js')

describe('plugin', function () {
  // const fakeDeferred = undefined
  let $page = null

  before(function () {
    $page = $('<div id="plugin" />')
    $page.appendTo('body')
    // return sinon.spy(jQuery, 'ajax');
  })

  after(function () {
    // jQuery.ajax.restore();
    $page.empty()
  })

  it('should have default reference type', () => expect(window.plugins).to.have.property('reference'))

  // it('should fetch a plugin script from the right location', function() {
  //   plugin.get('activity');
  //   expect(jQuery.ajax.calledOnce).to.be(true);
  //   return expect(jQuery.ajax.args[0][0].url).to.be('/plugins/activity/activity.js');
  // });

  it.skip('should render a plugin', function () {
    const item = {
      type: 'paragraph',
      text: 'blah [[Link]] asdf',
    }
    plugin.do($('#plugin'), item)
    expect($('#plugin').html()).to.be(
      '<p>blah <a class="internal" href="/link.html" data-page-name="link" title="view">Link</a> asdf</p>',
    )
  })
})
