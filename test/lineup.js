const lineup = require('../lib/lineup')
const { newPage } = require('../lib/page')
const expect = require('expect.js')

describe('lineup', function () {
  it('should assign unique keys', function () {
    const pageObject = newPage()
    lineup.debugReset()
    const key1 = lineup.addPage(pageObject)
    const key2 = lineup.addPage(pageObject)
    expect(key1).to.not.equal(key2)
  })

  it('should preserve identity', function () {
    const pageObject = newPage()
    lineup.debugReset()
    const key1 = lineup.addPage(pageObject)
    const key2 = lineup.addPage(pageObject)
    expect(key1).to.not.eql(null)
    expect(lineup.atKey(key1)).to.be(lineup.atKey(key2))
  })

  it('should remove a page', function () {
    const pageObject = newPage()
    lineup.debugReset()
    const key1 = lineup.addPage(pageObject)
    const key2 = lineup.addPage(pageObject)
    const key3 = lineup.addPage(pageObject)
    const result = lineup.removeKey(key2)
    expect([lineup.debugKeys(), result]).to.eql([[key1, key3], key2])
  })

  it('should remove downstream pages', function () {
    const pageObject = newPage()
    lineup.debugReset()
    const key1 = lineup.addPage(pageObject)
    const key2 = lineup.addPage(pageObject)
    const key3 = lineup.addPage(pageObject)
    const result = lineup.removeAllAfterKey(key1)
    expect([lineup.debugKeys(), result]).to.eql([[key1], [key2, key3]])
  })

  describe('crumbs', function () {
    const fromUri = function (uri) {
      lineup.debugReset()
      const fields = uri.split(/\//)
      const result = []
      while (fields.length) {
        var host = fields.shift()
        result.push(lineup.addPage(newPage({ title: fields.shift() }, host)))
      }
      return result
    }

    it('should reload welcome', function () {
      const keys = fromUri('view/welcome-visitors')
      const crumbs = lineup.crumbs(keys[0], 'foo.com')
      expect(crumbs).to.eql(['foo.com', 'view', 'welcome-visitors'])
    })

    it('should load remote welcome', function () {
      const keys = fromUri('bar.com/welcome-visitors')
      const crumbs = lineup.crumbs(keys[0], 'foo.com')
      expect(crumbs).to.eql(['bar.com', 'view', 'welcome-visitors'])
    })

    it('should reload welcome before some-page', function () {
      const keys = fromUri('view/some-page')
      const crumbs = lineup.crumbs(keys[0], 'foo.com')
      expect(crumbs).to.eql(['foo.com', 'view', 'welcome-visitors', 'view', 'some-page'])
    })

    it('should load remote welcome and some-page', function () {
      const keys = fromUri('bar.com/some-page')
      const crumbs = lineup.crumbs(keys[0], 'foo.com')
      expect(crumbs).to.eql(['bar.com', 'view', 'welcome-visitors', 'view', 'some-page'])
    })

    it('should remote the adjacent local page when changing origin', function () {
      const keys = fromUri('view/once-local/bar.com/some-page')
      const crumbs = lineup.crumbs(keys[1], 'foo.com')
      expect(crumbs).to.eql(['bar.com', 'view', 'welcome-visitors', 'view', 'some-page', 'foo.com', 'once-local'])
    })

    it('should remote the stacked adjacent local page when changing origin', function () {
      const keys = fromUri('view/stack1/view/stack2/view/once-local/bar.com/some-page')
      const crumbs = lineup.crumbs(keys[3], 'foo.com')
      expect(crumbs).to.eql(['bar.com', 'view', 'welcome-visitors', 'view', 'some-page', 'foo.com', 'once-local'])
    })

    it('should remote the welcome rooted stacked adjacent local page when changing origin', function () {
      const keys = fromUri('view/welcome-visitors/view/stack2/view/once-local/bar.com/some-page')
      const crumbs = lineup.crumbs(keys[3], 'foo.com')
      expect(crumbs).to.eql(['bar.com', 'view', 'welcome-visitors', 'view', 'some-page', 'foo.com', 'once-local'])
    })
  })
})
