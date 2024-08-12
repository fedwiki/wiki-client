/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const _ = require('underscore');
const expect = require('expect.js');
const sinon = require('sinon');

const pageHandler = require('../lib/pageHandler');
const mockServer = require('./mockServer');

// disable reference to dom
pageHandler.useLocalStorage = () => false;

describe('pageHandler.get', function() {

  it('should have an empty context', () => expect(pageHandler.context).to.eql([]));

  const pageInformationWithoutSite = {
    slug: 'slugName',
    rev: 'revName'
  };

  const genericPageInformation = _.extend( {}, pageInformationWithoutSite, {site: 'siteName'} );

  const genericPageData = {
    journal: []
  };

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
      },
      put(route, data, done) {
        return $.ajax({
          type: 'PUT',
          url: `/page/${route}/action`,
          data: {
            'action': JSON.stringify(data)
          },
          success() { return done(null); },
          error(xhr, type, msg) { return done({xhr, type, msg}); }});
      }
    };
    wiki.site = site => ({
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

  describe('ajax fails', function() {

    before(() => mockServer.simulatePageNotFound());

    after(() => jQuery.ajax.restore());

    it("should tell us when it can't find a page (server specified)", function() {
      const whenGotten = sinon.spy();
      const whenNotGotten = sinon.spy();

      pageHandler.get({
        pageInformation: _.clone( genericPageInformation ),
        whenGotten,
        whenNotGotten
      });

      expect( whenGotten.called ).to.be.false;
      return expect( whenNotGotten.called ).to.be.true;
    });

    return it("should tell us when it can't find a page (server unspecified)", function() {
      const whenGotten = sinon.spy();
      const whenNotGotten = sinon.spy();

      pageHandler.get({
        pageInformation: _.clone( pageInformationWithoutSite ),
        whenGotten,
        whenNotGotten
      });

      expect( whenGotten.called ).to.be.false;
      return expect( whenNotGotten.called ).to.be.true;
    });
  });

  describe('ajax, success', function() {
    before(function() {
      sinon.stub(jQuery, "ajax").yieldsTo('success', genericPageData);
      return $('<div id="pageHandler5" data-site="foo" />').appendTo('body');
    });

    it('should get a page from specific site', function() {
      const whenGotten = sinon.spy();
      pageHandler.get({
        pageInformation: _.clone( genericPageInformation ),
        whenGotten
      });

      expect(whenGotten.calledOnce).to.be.true;
      expect(jQuery.ajax.calledOnce).to.be.true;
      expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET');
      return expect(jQuery.ajax.args[0][0].url).to.match(new RegExp(`^//siteName/slugName\\.json`));
    });

    return after(() => jQuery.ajax.restore());
  });

  return describe('ajax, search', function() {
    before(function() {
      mockServer.simulatePageNotFound();
      return pageHandler.context = ['view', 'example.com', 'asdf.test', 'foo.bar'];});

    it('should search through the context for a page', function() {
      pageHandler.get({
        pageInformation: _.clone( pageInformationWithoutSite ),
        whenGotten: sinon.stub(),
        whenNotGotten: sinon.stub()
      });

      expect(jQuery.ajax.args[0][0].url).to.match(new RegExp(`^/slugName\\.json`));
      expect(jQuery.ajax.args[1][0].url).to.match(new RegExp(`^//example.com/slugName\\.json`));
      expect(jQuery.ajax.args[2][0].url).to.match(new RegExp(`^//asdf.test/slugName\\.json`));
      return expect(jQuery.ajax.args[3][0].url).to.match(new RegExp(`^//foo.bar/slugName\\.json`));
    });

    return after(() => jQuery.ajax.restore());
  });
});

describe('pageHandler.put', function() {
  before(function() {
    $('<div id="pageHandler3" />').appendTo('body');
    return sinon.stub(jQuery, "ajax").yieldsTo('success');
  });

  // can't test right now as expects to have access to original page, so index can be updated.
  it.skip('should save an action', function(done) {
    const action = {type: 'edit', id: 1, item: {id:1}};
    pageHandler.put($('#pageHandler3'), action);
    expect(jQuery.ajax.args[0][0].data).to.eql({action: JSON.stringify(action)});
    return done();
  });

  return after(() => jQuery.ajax.restore());
});
