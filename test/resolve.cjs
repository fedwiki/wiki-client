// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const resolve = require('../lib/resolve.cjs');
const expect = require('expect.js');

// Here we test new features retlated to escaping/sanitizing text while resolving.
// See other related tests at /tests/wiki.coffee

const r = text => resolve.resolveLinks(text);

const f = function(text) {
  const found = [];
  text
    .replace(/\s+<img src="\/images\/external-link-ltr-icon.png">/, '')
    .replace(/>(.*?)</g, (match, each) => found.push(each));
  return found;
};

describe('resolve', function() {

  describe('plain text', () => it('should pass unchanged', () => expect(r('The quick brown fox.')).to.eql('The quick brown fox.')));

  describe('escaping', function() {
    it('should encode <, >, & in plain text', () => expect(r('5 < 10 && 5 > 3')).to.eql('5 &lt; 10 &amp;&amp; 5 &gt; 3'));

    it('should encode  <, >, & in link text', () => expect(r('[[5 < 10 && 5 > 3]]')).to.contain('>5 &lt; 10 &amp;&amp; 5 &gt; 3</a>'));

    it('should not encode before making slugs for hrefs', () => expect(r('[[5 < 10 && 5 > 3]]')).to.contain('href="/5--10--5--3.html"'));

    return it('should not encode before making slugs for data-page-names', () => expect(r('[[5 < 10 && 5 > 3]]')).to.contain('data-page-name="5--10--5--3"'));
  });

  describe('multiple links', function() {
    it('should be kept ordered', () => expect(f(r('[[alpha]],[[beta]]&[[gamma]]'))).to.eql(['alpha', ',', 'beta', '&amp;', 'gamma']));

    it('should preserve internal before external', () => expect(f(r('[[alpha]],[http:c2.com beta]'))).to.eql(['alpha', ',', 'beta']));

    return it('should preserve external before internal', () => expect(f(r('[http:c2.com beta],[[alpha]]'))).to.eql(['beta', ',', 'alpha']));
});

  return describe('markers', () => it('should be adulterated where unexpected', () => expect(r('foo 〖12〗 bar')).to.eql("foo 〖 12 〗 bar")));
});



