(function() {
  var expect, mockServer, pageHandler, sinon, wiki, _;

  _ = require('underscore');

  expect = require('expect.js');

  sinon = require('sinon');

  wiki = require('../lib/wiki');

  pageHandler = require('../lib/pageHandler');

  mockServer = require('./mockServer');

  wiki.useLocalStorage = function() {
    return false;
  };

  describe('pageHandler.get', function() {
    var genericPageData, genericPageInformation, pageInformationWithoutSite;
    it('should have an empty context', function() {
      return expect(pageHandler.context).to.eql([]);
    });
    pageInformationWithoutSite = {
      slug: 'slugName',
      rev: 'revName'
    };
    genericPageInformation = _.extend({}, pageInformationWithoutSite, {
      site: 'siteName'
    });
    genericPageData = {
      journal: []
    };
    describe('ajax fails', function() {
      before(function() {
        return mockServer.simulatePageNotFound();
      });
      after(function() {
        return jQuery.ajax.restore();
      });
      it("should tell us when it can't find a page (server specified)", function() {
        var whenGotten, whenNotGotten;
        whenGotten = sinon.spy();
        whenNotGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(genericPageInformation),
          whenGotten: whenGotten,
          whenNotGotten: whenNotGotten
        });
        expect(whenGotten.called).to.be["false"];
        return expect(whenNotGotten.called).to.be["true"];
      });
      return it("should tell us when it can't find a page (server unspecified)", function() {
        var whenGotten, whenNotGotten;
        whenGotten = sinon.spy();
        whenNotGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(pageInformationWithoutSite),
          whenGotten: whenGotten,
          whenNotGotten: whenNotGotten
        });
        expect(whenGotten.called).to.be["false"];
        return expect(whenNotGotten.called).to.be["true"];
      });
    });
    describe('ajax, success', function() {
      before(function() {
        sinon.stub(jQuery, "ajax").yieldsTo('success', genericPageData);
        return $('<div id="pageHandler5" data-site="foo" />').appendTo('body');
      });
      it('should get a page from specific site', function() {
        var whenGotten;
        whenGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(genericPageInformation),
          whenGotten: whenGotten
        });
        expect(whenGotten.calledOnce).to.be["true"];
        expect(jQuery.ajax.calledOnce).to.be["true"];
        expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET');
        return expect(jQuery.ajax.args[0][0].url).to.match(/^http:\/\/siteName\/slugName\.json\?random=[a-z0-9]{8}$/);
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
    return describe('ajax, search', function() {
      before(function() {
        mockServer.simulatePageNotFound();
        return pageHandler.context = ['view', 'example.com', 'asdf.test', 'foo.bar'];
      });
      it('should search through the context for a page', function() {
        pageHandler.get({
          pageInformation: _.clone(pageInformationWithoutSite),
          whenGotten: sinon.stub(),
          whenNotGotten: sinon.stub()
        });
        expect(jQuery.ajax.args[0][0].url).to.match(/^\/slugName\.json\?random=[a-z0-9]{8}$/);
        expect(jQuery.ajax.args[1][0].url).to.match(/^http:\/\/example.com\/slugName\.json\?random=[a-z0-9]{8}$/);
        expect(jQuery.ajax.args[2][0].url).to.match(/^http:\/\/asdf.test\/slugName\.json\?random=[a-z0-9]{8}$/);
        return expect(jQuery.ajax.args[3][0].url).to.match(/^http:\/\/foo.bar\/slugName\.json\?random=[a-z0-9]{8}$/);
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
  });

  describe('pageHandler.put', function() {
    before(function() {
      $('<div id="pageHandler3" />').appendTo('body');
      return sinon.stub(jQuery, "ajax").yieldsTo('success');
    });
    it('should save an action', function(done) {
      var action;
      action = {
        type: 'edit',
        id: 1,
        item: {
          id: 1
        }
      };
      pageHandler.put($('#pageHandler3'), action);
      expect(jQuery.ajax.args[0][0].data).to.eql({
        action: JSON.stringify(action)
      });
      return done();
    });
    return after(function() {
      return jQuery.ajax.restore();
    });
  });

}).call(this);

/*
//@ sourceMappingURL=pageHandler.js.map
*/