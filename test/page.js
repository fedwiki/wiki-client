const { newPage } = require('../lib/page')
const expect = require('expect.js')

describe('page', function () {
  before(function () {
    const wiki = {}
    wiki.site = site => ({
      getURL(route) {
        return `//${site}/${route}`
      },

      getDirectURL(route) {
        return `//${site}/${route}`
      },
    })
    globalThis.wiki = wiki
  })

  describe('newly created', function () {
    it('should start empty', function () {
      const pageObject = newPage()
      expect(pageObject.getSlug()).to.eql('empty')
    })

    it('should not be remote', function () {
      const pageObject = newPage()
      expect(pageObject.isRemote()).to.be.false
    })

    it('should have default contex', function () {
      const pageObject = newPage()
      expect(pageObject.getContext()).to.eql(['view'])
    })
  })

  describe('from json', function () {
    it('should have a title', function () {
      const pageObject = newPage({
        title: 'New Page',
      })
      expect(pageObject.getSlug()).to.eql('new-page')
    })

    it('should have a default context', function () {
      const pageObject = newPage({
        title: 'New Page',
      })
      expect(pageObject.getContext()).to.eql(['view'])
    })

    it('should have context from site and (reversed) journal', function () {
      const pageObject = newPage(
        {
          journal: [
            { type: 'fork', site: 'one.org' },
            { type: 'fork', site: 'two.org' },
          ],
        },
        'example.com',
      )
      expect(pageObject.getContext()).to.eql(['view', 'example.com', 'two.org', 'one.org'])
    })

    it('should have context without duplicates', function () {
      const pageObject = newPage(
        {
          journal: [
            { type: 'fork', site: 'one.org' },
            { type: 'fork', site: 'one.org' },
          ],
        },
        'example.com',
      )
      expect(pageObject.getContext()).to.eql(['view', 'example.com', 'one.org'])
    })

    it('should have neighbors from site, reference and journal (in order, without duplicates)', function () {
      const pageObject = newPage(
        {
          story: [
            { type: 'reference', site: 'one.org' },
            { type: 'reference', site: 'two.org' },
            { type: 'reference', site: 'one.org' },
          ],
          journal: [
            { type: 'fork', site: 'three.org' },
            { type: 'fork', site: 'four.org' },
            { type: 'fork', site: 'three.org' },
          ],
        },
        'example.com',
      )
      expect(pageObject.getNeighbors()).to.eql(['example.com', 'one.org', 'two.org', 'three.org', 'four.org'])
    })
  })

  describe('site info', function () {
    it('should report null if local', function () {
      const pageObject = newPage()
      expect(pageObject.getRemoteSite()).to.be(null)
    })

    it('should report local host if provided', function () {
      const pageObject = newPage()
      expect(pageObject.getRemoteSite('fed.wiki.org')).to.be('fed.wiki.org')
    })

    it('should report remote host if remote', function () {
      const pageObject = newPage({}, 'sfw.c2.com')
      expect(pageObject.getRemoteSite('fed.wiki.org')).to.be('sfw.c2.com')
    })
  })

  describe('site lineup', function () {
    it('should start with welcome-visitors', function () {
      const pageObject = newPage({ title: 'Welcome Visitors' })
      expect(pageObject.siteLineup()).to.be('/view/welcome-visitors')
    })

    it('should end on this page', function () {
      const pageObject = newPage({ title: 'Some Page' })
      expect(pageObject.siteLineup()).to.be('/view/welcome-visitors/view/some-page')
    })

    it('should use absolute address for remote pages', function () {
      const pageObject = newPage({ title: 'Some Page' }, 'fed.wiki.org')
      expect(pageObject.siteLineup()).to.be('//fed.wiki.org/view/welcome-visitors/view/some-page')
    })
  })

  describe('site details', function () {
    it('should report residence only if local', function () {
      const pageObject = newPage({ plugin: 'method' })
      expect(pageObject.getRemoteSiteDetails()).to.be('method plugin')
    })

    it('should report residence and local host if provided', function () {
      const pageObject = newPage({ plugin: 'method' })
      expect(pageObject.getRemoteSiteDetails('fed.wiki.org')).to.be('fed.wiki.org\nmethod plugin')
    })

    it('should report residence and remote host if remote', function () {
      const pageObject = newPage({ plugin: 'method' }, 'sfw.c2.com')
      expect(pageObject.getRemoteSiteDetails('fed.wiki.org')).to.be('sfw.c2.com\nmethod plugin')
    })
  })
})
