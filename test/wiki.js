const wiki = require('../lib/wiki')
const expect = require('expect.js')

describe('wiki', function () {
  describe('link resolution', function () {
    it('should pass free text as is', function () {
      const s = wiki.resolveLinks('hello world')
      expect(s).to.be('hello world')
    })

    describe('internal links', function () {
      const s = wiki.resolveLinks('hello [[world]]')
      it('should be class internal', () => expect(s).to.contain('class="internal"'))
      it('should relative reference html', () => expect(s).to.contain('href="/world.html"'))
      it('should have data-page-name', () => expect(s).to.contain('data-page-name="world"'))
    })

    describe('internal links with space', function () {
      const s = wiki.resolveLinks('hello [[ world]]')
      it('should be class spaced', () => expect(s).to.contain('class="internal spaced"'))
      it('should relative reference html', () => expect(s).to.contain('href="/-world.html"'))
      it('should have data-page-name', () => expect(s).to.contain('data-page-name="-world"'))
    })

    describe('external links', function () {
      const s = wiki.resolveLinks('hello [http://world.com?foo=1&bar=2 world]')
      it('should be class external', () => expect(s).to.contain('class="external"'))
      it('should absolute reference html', () => expect(s).to.contain('href="http://world.com?foo=1&bar=2"'))
      it('should not have data-page-name', () => expect(s).to.not.contain('data-page-name'))
    })
  })

  describe('slug formation', function () {
    it('should convert capitals to lowercase', function () {
      const s = wiki.asSlug('WelcomeVisitors')
      expect(s).to.be('welcomevisitors')
    })

    it('should convert spaces to dashes', function () {
      const s = wiki.asSlug(' now is  the time ')
      expect(s).to.be('-now-is--the-time-')
    })

    it('should pass letters, numbers and dash', function () {
      const s = wiki.asSlug('THX-1138')
      expect(s).to.be('thx-1138')
    })

    it('should discard other puctuation', function () {
      const s = wiki.asSlug('(The) World, Finally.')
      expect(s).to.be('the-world-finally')
    })
  })
})
