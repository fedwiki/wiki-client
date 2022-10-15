_ = require 'underscore'
expect = require 'expect.js'
sinon = require 'sinon'

pageHandler = require '../lib/pageHandler'
mockServer = require './mockServer'

# disable reference to dom
pageHandler.useLocalStorage = -> false

describe 'pageHandler.get', ->

  it 'should have an empty context', ->
    expect(pageHandler.context).to.eql([])

  pageInformationWithoutSite = {
    slug: 'slugName'
    rev: 'revName'
  }

  genericPageInformation = _.extend( {}, pageInformationWithoutSite, {site: 'siteName'} )

  genericPageData = {
    journal: []
  }

  beforeEach () ->
    wiki = {}
    wiki.local = {
      get: (route, done) ->
        done {msg: "no page named '#{route}' in browser local storage"}
    }
    wiki.origin = {
      get: (route, done) ->
        $.ajax
          type: 'GET'
          dataType: 'json'
          url: "/#{route}"
          success: (page) -> done null, page
          error: (xhr, type, msg) -> done {msg, xhr}, null
      put: (route, data, done) ->
        $.ajax
          type: 'PUT'
          url: "/page/#{route}/action"
          data:
            'action': JSON.stringify(data)
          success: () -> done null
          error: (xhr, type, msg) -> done {xhr, type, msg}
    }
    wiki.site = (site) -> {
      get: (route, done) ->
        url = "//#{site}/#{route}"
        $.ajax
          type: 'GET'
          dataType: 'json'
          url: url
          success: (data) -> done null, data
          error: (xhr, type, msg) ->
            done {msg, xhr}, null
    }
    global.wiki = wiki

  describe 'ajax fails', ->

    before ->
      mockServer.simulatePageNotFound()

    after ->
      jQuery.ajax.restore()

    it "should tell us when it can't find a page (server specified)", ->
      whenGotten = sinon.spy()
      whenNotGotten = sinon.spy()

      pageHandler.get
        pageInformation: _.clone( genericPageInformation )
        whenGotten: whenGotten
        whenNotGotten: whenNotGotten

      expect( whenGotten.called ).to.be.false
      expect( whenNotGotten.called ).to.be.true

    it "should tell us when it can't find a page (server unspecified)", ->
      whenGotten = sinon.spy()
      whenNotGotten = sinon.spy()

      pageHandler.get
        pageInformation: _.clone( pageInformationWithoutSite )
        whenGotten: whenGotten
        whenNotGotten: whenNotGotten

      expect( whenGotten.called ).to.be.false
      expect( whenNotGotten.called ).to.be.true

  describe 'ajax, success', ->
    before ->
      sinon.stub(jQuery, "ajax").yieldsTo('success', genericPageData)
      $('<div id="pageHandler5" data-site="foo" />').appendTo('body')

    it 'should get a page from specific site', ->
      whenGotten = sinon.spy()
      pageHandler.get
        pageInformation: _.clone( genericPageInformation )
        whenGotten: whenGotten

      expect(whenGotten.calledOnce).to.be.true
      expect(jQuery.ajax.calledOnce).to.be.true
      expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET')
      expect(jQuery.ajax.args[0][0].url).to.match(///^//siteName/slugName\.json///)

    after ->
      jQuery.ajax.restore()

  describe 'ajax, search', ->
    before ->
      mockServer.simulatePageNotFound()
      pageHandler.context = ['view', 'example.com', 'asdf.test', 'foo.bar']

    it 'should search through the context for a page', ->
      pageHandler.get
        pageInformation: _.clone( pageInformationWithoutSite )
        whenGotten: sinon.stub()
        whenNotGotten: sinon.stub()

      expect(jQuery.ajax.args[0][0].url).to.match(///^/slugName\.json///)
      expect(jQuery.ajax.args[1][0].url).to.match(///^//example.com/slugName\.json///)
      expect(jQuery.ajax.args[2][0].url).to.match(///^//asdf.test/slugName\.json///)
      expect(jQuery.ajax.args[3][0].url).to.match(///^//foo.bar/slugName\.json///)

    after ->
      jQuery.ajax.restore()

describe 'pageHandler.put', ->
  before ->
    $('<div id="pageHandler3" />').appendTo('body')
    sinon.stub(jQuery, "ajax").yieldsTo('success')

  # can't test right now as expects to have access to original page, so index can be updated.
  it.skip 'should save an action', (done) ->
    action = {type: 'edit', id: 1, item: {id:1}}
    pageHandler.put $('#pageHandler3'), action
    expect(jQuery.ajax.args[0][0].data).to.eql({action: JSON.stringify(action)})
    done()

  after ->
    jQuery.ajax.restore()
