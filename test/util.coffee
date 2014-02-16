wiki = require '../lib/wiki'
util = require '../lib/util'
expect = require 'expect.js'

timezoneOffset = ->
  ((new Date(1333843344000)).getTimezoneOffset() * 60)

describe 'wiki', ->

  describe 'link resolution', ->

    it 'should pass free text as is', ->
      s = wiki.resolveLinks "hello world"
      expect(s).to.be 'hello world'

    describe 'internal links', ->
      s = wiki.resolveLinks "hello [[world]]"
      it 'should be class internal', ->
        expect(s).to.contain 'class="internal"'
      it 'should relative reference html', ->
        expect(s).to.contain 'href="/world.html"'
      it 'should have data-page-name', ->
        expect(s).to.contain 'data-page-name="world"'

    describe 'external links', ->
      s = wiki.resolveLinks "hello [http://world.com?foo=1&bar=2 world]"
      it 'should be class external', ->
        expect(s).to.contain 'class="external"'
      it 'should absolute reference html', ->
        expect(s).to.contain 'href="http://world.com?foo=1&bar=2"'
      it 'should not have data-page-name', ->
        expect(s).to.not.contain 'data-page-name'

  describe 'slug formation', ->

    it 'should convert capitals to lowercase', ->
      s = wiki.asSlug 'WelcomeVisitors'
      expect(s).to.be 'welcomevisitors'

    it 'should convert spaces to dashes', ->
      s = wiki.asSlug ' now is  the time '
      expect(s).to.be '-now-is--the-time-'

    it 'should pass letters, numbers and dash', ->
      s = wiki.asSlug 'THX-1138'
      expect(s).to.be 'thx-1138'

    it 'should discard other puctuation', ->
      s = wiki.asSlug '(The) World, Finally.'
      expect(s).to.be 'the-world-finally'

describe 'util', ->
  it 'should make random bytes', ->
    a = util.randomByte()
    expect(a).to.be.a 'string'
    expect(a.length).to.be 2
  it 'should make random byte strings', ->
    s = util.randomBytes(4)
    expect(s).to.be.a 'string'
    expect(s.length).to.be 8

  it 'should format unix time', ->
    s = util.formatTime(1333843344 + timezoneOffset())
    expect(s).to.be '12:02 AM<br>8 Apr 2012'
  it 'should format javascript time', ->
    s = util.formatTime(1333843344000 + timezoneOffset() * 1000)
    expect(s).to.be '12:02 AM<br>8 Apr 2012'
  it 'should format revision date', ->
    s = util.formatDate(1333843344000 + timezoneOffset() * 1000)
    expect(s).to.be 'Sun Apr 8, 2012<br>12:02:24 AM'

  it 'should make emptyPage page with title, story and journal', ->
    page = util.emptyPage()
    expect(page.title).to.be 'empty'
    expect(page.story).to.eql []
    expect(page.journal).to.eql []
  it 'should make fresh empty page each call', ->
    page = util.emptyPage()
    page.story.push {type: 'junk'}
    page = util.emptyPage()
    expect(page.story).to.eql []

