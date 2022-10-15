plugin = require '../lib/plugin'
sinon = require 'sinon'
expect = require 'expect.js'

describe 'plugin', ->
  fakeDeferred = undefined
  $page = null

  before ->
    $page = $('<div id="plugin" />')
    $page.appendTo('body')
    sinon.spy(jQuery, 'ajax')

  after ->
    jQuery.ajax.restore()
    $page.empty()

  it 'should have default reference type', ->
    expect(window.plugins).to.have.property('reference')

  it 'should fetch a plugin script from the right location', ->
    plugin.get 'activity'
    expect(jQuery.ajax.calledOnce).to.be(true)
    expect(jQuery.ajax.args[0][0].url).to.be('/plugins/activity/activity.js')

  it.skip 'should render a plugin', ->
    item =
      type: 'paragraph'
      text: 'blah [[Link]] asdf'
    plugin.do $('#plugin'), item
    expect($('#plugin').html()).to
      .be('<p>blah <a class="internal" href="/link.html" data-page-name="link" title="view">Link</a> asdf</p>')
