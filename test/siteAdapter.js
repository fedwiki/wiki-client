// test/siteAdapter.js
/* eslint-env mocha */
const expect = require('expect.js');
const siteAdapter = require('../lib/siteAdapter');

function probeFavicon(site, callback) {
  const adapter = siteAdapter.site(site);
  const flag = adapter.flag();
  
  // If we got a real flag URL immediately, return it
  if (flag && !flag.startsWith('data:')) {
    return callback(flag);
  }
  
  // Otherwise, wait for the adapter to resolve and try again
  setTimeout(() => {
    callback(adapter.flag());
  }, 100);
}

describe('siteAdapter favicon probe URL', () => {
  it('BUG: 127.0.0.1 should use http:// not //', (done) => {
    probeFavicon('127.0.0.1:3001', (url) => {
      expect(url).to.be('http://127.0.0.1:3001/favicon.png');
      done();
    });
  });

  it('BUG: [::1] should use http:// not //', (done) => {
    probeFavicon('[::1]:4000', (url) => {
      expect(url).to.be('http://[::1]:4000/favicon.png');
      done();
    });
  });

  it('works today: sub.localhost handled via special-case', (done) => {
    probeFavicon('sub.localhost:3000', (url) => {
      expect(url).to.be('http://sub.localhost:3000/favicon.png');
      done();
    });
  });

  it('public host uses proxy path in HTTPS environment', (done) => {
    probeFavicon('example.com', (url) => {
      expect(url).to.be('/proxy/example.com/favicon.png');
      done();
    });
  });
});