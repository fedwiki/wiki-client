const random = require('../lib/random')
const expect = require('expect.js')

describe('random', function () {
  it('should make random bytes', function () {
    const a = random.randomByte()
    expect(a).to.be.a('string')
    expect(a.length).to.be(2)
  })

  it('should make random byte strings', function () {
    const s = random.randomBytes(4)
    expect(s).to.be.a('string')
    expect(s.length).to.be(8)
  })

  it('should make random item ids', function () {
    const s = random.itemId()
    expect(s).to.be.a('string')
    expect(s.length).to.be(16)
  })
})
