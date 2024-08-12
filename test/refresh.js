refresh = require('../lib/refresh')
lineup = require('../lib/lineup')
mockServer = require('./mockServer')

describe 'refresh', ->

  $page = undefined

  beforeEach ->
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
    }
    wiki.site = (site) -> {
      flag: () ->
        "//#{site}/favicon.png"
      getDirectURL: (route) ->
        "//#{site}/#{route}"
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

  describe 'when page not found', ->

    before ->
      $page = $('<div id="ghost" />')
      $page.appendTo('body')
      mockServer.simulatePageNotFound()
    after ->
      jQuery.ajax.restore()

    it.skip "creates a ghost page", ->
      $page.each refresh.cycle
      expect( $page.hasClass('ghost') ).to.be(true)
      expect( key = $page.data('key') ).to.be.a('string')
      expect( pageObject = lineup.atKey(key) ).to.be.an('object')
      expect( pageObject.getRawPage().story[0].type ).to.be('future')

  describe 'when page found', ->

    before ->
      $page = $('<div id="refresh" />')
      $page.appendTo('body')
      mockServer.simulatePageFound({title: 'asdf'})
    after ->
      jQuery.ajax.restore()

    it.skip 'should refresh a page', (done) ->
      $page.each refresh.cycle
      expect($('#refresh h1').text().trim()).to.be('asdf')
      done()
