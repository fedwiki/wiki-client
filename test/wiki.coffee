wiki = require '../lib/wiki'
expect = require 'expect.js'

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
