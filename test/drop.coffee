drop = require '../lib/drop'
expect = require 'expect.js'

# construct mock event objects

signal = (mock, handler) ->
  handler mock

mockDrop = (dataTransfer) ->
  preventDefault: ->
  stopPropagation: ->

  originalEvent:
    dataTransfer: dataTransfer

mockUrl = (type, url) ->
  mockDrop
    types: [type]
    getData: (spec) -> url

mockFile = (spec) ->
  mockDrop
    types: ['File']
    files: [spec]

# test the handling of mock events

describe 'drop', ->

  it 'should handle remote pages', ->
    event = mockUrl 'text/uri-list', 'http://localhost:3000/fed.wiki.org/welcome-visitors'
    signal event, drop.dispatch
      page: (page) -> expect(page).to.eql({slug: 'welcome-visitors', site: 'fed.wiki.org'})

  it 'should handle local pages', ->
    event = mockUrl 'text/uri-list', 'http://fed.wiki.org/view/welcome-visitors'
    signal event, drop.dispatch
      page: (page) -> expect(page).to.eql({slug: 'welcome-visitors', site: 'fed.wiki.org'})

  it 'should handle list of pages', ->
    event = mockUrl 'text/uri-list', 'http://sfw.c2.com/view/welcome-visitors/view/pattern-language'
    signal event, drop.dispatch
      page: (page) -> expect(page).to.eql({slug: 'pattern-language', site: 'sfw.c2.com'})

  it 'should handle a YouTube video', ->
    event = mockUrl 'text/uri-list', 'https://www.youtube.com/watch?v=rFpDK2KhAgw'
    signal event, drop.dispatch
      video: (video) -> expect(video).to.eql({text: 'YOUTUBE rFpDK2KhAgw'})

  it 'should handle a YouTube playlist', ->
    event = mockUrl 'text/uri-list', 'https://www.youtube.com/watch?v=ksoe4Un7bLo&list=PLze65Ckn-WXZpRzLeUPxqsEkFY6vt2hF7'
    signal event, drop.dispatch
      video: (video) -> expect(video).to.eql({text: 'YOUTUBE PLAYLIST PLze65Ckn-WXZpRzLeUPxqsEkFY6vt2hF7'})

  it 'should handle a YouTu.be video', ->
    event = mockUrl 'text/uri-list', 'https://youtu.be/z2p4VRKgQYU'
    signal event, drop.dispatch
      video: (video) -> expect(video).to.eql({text: 'YOUTUBE z2p4VRKgQYU'})

  it 'should handle a YouTu.be playlist', ->
    event = mockUrl 'text/uri-list', 'https://youtu.be/pBu6cixcaxI?list=PL0LQM0SAx601_99m2E2NPsm62pKoSCnV5'
    signal event, drop.dispatch
      video: (video) -> expect(video).to.eql({text: 'YOUTUBE PLAYLIST PL0LQM0SAx601_99m2E2NPsm62pKoSCnV5'})

  it 'should handle a vimeo video', ->
    event = mockUrl 'text/uri-list', 'https://vimeo.com/90834988'
    signal event, drop.dispatch
      video: (video) -> expect(video).to.eql({text: 'VIMEO 90834988'})

  it 'should handle a archive.org video', ->
    event = mockUrl 'text/uri-list', 'https://archive.org/details/IcelandJazz'
    signal event, drop.dispatch
      video: (video) -> expect(video).to.eql({text: 'ARCHIVE IcelandJazz'})

  it 'should handle a TEDX video', ->
    event = mockUrl 'text/uri-list', 'http://tedxtalks.ted.com/video/Be-a-Daydream-Believer-Anne-Zac'
    signal event, drop.dispatch
      video: (video) -> expect(video).to.eql({text: 'TEDX Be-a-Daydream-Believer-Anne-Zac'})

  it 'should handle a TED video', ->
    event = mockUrl 'text/uri-list', 'http://www.ted.com/talks/david_camarillo_why_helmets_don_t_prevent_concussions_and_what_might'
    signal event, drop.dispatch
      video: (video) -> expect(video).to.eql({text: 'TED david_camarillo_why_helmets_don_t_prevent_concussions_and_what_might'})

  it 'should handle text file', ->
    file = {name: "foo.txt", type: "text/plain"}
    event = mockFile file
    signal event, drop.dispatch
      file: (data) -> expect(data).to.eql(file)
