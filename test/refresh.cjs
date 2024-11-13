// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const refresh = require('../lib/refresh.cjs');
const lineup = require('../lib/lineup.cjs');
const mockServer = require('./mockServer.cjs');

describe('refresh', function() {

  let $page = undefined;

  beforeEach(function() {
    const wiki = {};
    wiki.local = {
      get(route, done) {
        return done({msg: `no page named '${route}' in browser local storage`});
      }
    };
    wiki.origin = {
      get(route, done) {
        return $.ajax({
          type: 'GET',
          dataType: 'json',
          url: `/${route}`,
          success(page) { return done(null, page); },
          error(xhr, type, msg) { return done({msg, xhr}, null); }
        });
      }
    };
    wiki.site = site => ({
      flag() {
        return `//${site}/favicon.png`;
      },

      getDirectURL(route) {
        return `//${site}/${route}`;
      },

      get(route, done) {
        const url = `//${site}/${route}`;
        return $.ajax({
          type: 'GET',
          dataType: 'json',
          url,
          success(data) { return done(null, data); },
          error(xhr, type, msg) {
            return done({msg, xhr}, null);
          }
        });
      }
    });
    return global.wiki = wiki;
  });

  describe('when page not found', function() {

    before(function() {
      $page = $('<div id="ghost" />');
      $page.appendTo('body');
      return mockServer.simulatePageNotFound();
    });
    after(() => jQuery.ajax.restore());

    return it.skip("creates a ghost page", function() {
      let key, pageObject;
      $page.each(refresh.cycle);
      expect( $page.hasClass('ghost') ).to.be(true);
      expect( key = $page.data('key') ).to.be.a('string');
      expect( pageObject = lineup.atKey(key) ).to.be.an('object');
      return expect( pageObject.getRawPage().story[0].type ).to.be('future');
    });
  });

  return describe('when page found', function() {

    before(function() {
      $page = $('<div id="refresh" />');
      $page.appendTo('body');
      return mockServer.simulatePageFound({title: 'asdf'});
    });
    after(() => jQuery.ajax.restore());

    return it.skip('should refresh a page', function(done) {
      $page.each(refresh.cycle);
      expect($('#refresh h1').text().trim()).to.be('asdf');
      return done();
    });
  });
});
