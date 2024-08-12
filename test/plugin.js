// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const plugin = require('../lib/plugin');
const sinon = require('sinon');
const expect = require('expect.js');

describe('plugin', function() {
  const fakeDeferred = undefined;
  let $page = null;

  before(function() {
    $page = $('<div id="plugin" />');
    $page.appendTo('body');
    return sinon.spy(jQuery, 'ajax');
  });

  after(function() {
    jQuery.ajax.restore();
    return $page.empty();
  });

  it('should have default reference type', () => expect(window.plugins).to.have.property('reference'));

  it('should fetch a plugin script from the right location', function() {
    plugin.get('activity');
    expect(jQuery.ajax.calledOnce).to.be(true);
    return expect(jQuery.ajax.args[0][0].url).to.be('/plugins/activity/activity.js');
  });

  return it.skip('should render a plugin', function() {
    const item = {
      type: 'paragraph',
      text: 'blah [[Link]] asdf'
    };
    plugin.do($('#plugin'), item);
    return expect($('#plugin').html()).to
      .be('<p>blah <a class="internal" href="/link.html" data-page-name="link" title="view">Link</a> asdf</p>');
  });
});
