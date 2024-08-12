/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const random = require('../lib/random');
const expect = require('expect.js');

describe('random', function() {

  it('should make random bytes', function() {
    const a = random.randomByte();
    expect(a).to.be.a('string');
    return expect(a.length).to.be(2);
  });

  it('should make random byte strings', function() {
    const s = random.randomBytes(4);
    expect(s).to.be.a('string');
    return expect(s.length).to.be(8);
  });

  return it('should make random item ids', function() {
    const s = random.itemId();
    expect(s).to.be.a('string');
    return expect(s.length).to.be(16);
  });
});
