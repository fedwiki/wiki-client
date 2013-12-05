(function() {
  var newPage;

  newPage = require('../lib/page').newPage;

  describe('page', function() {
    describe('newly created', function() {
      it('should start empty', function() {
        var pageObject;
        pageObject = newPage();
        return expect(pageObject.getSlug()).to.eql('empty');
      });
      it('should not be remote', function() {
        var pageObject;
        pageObject = newPage();
        return expect(pageObject.isRemote()).to.be["false"];
      });
      return it('should have default contex', function() {
        var pageObject;
        pageObject = newPage();
        return expect(pageObject.getContext()).to.eql(['view']);
      });
    });
    return describe('from json', function() {
      it('should have a title', function() {
        var pageObject;
        pageObject = newPage({
          title: "New Page"
        });
        return expect(pageObject.getSlug()).to.eql('new-page');
      });
      it('should have a default context', function() {
        var pageObject;
        pageObject = newPage({
          title: "New Page"
        });
        return expect(pageObject.getContext()).to.eql(['view']);
      });
      it('should have context from site and (reversed) journal', function() {
        var pageObject;
        pageObject = newPage({
          journal: [
            {
              type: 'fork',
              site: 'one.org'
            }, {
              type: 'fork',
              site: 'two.org'
            }
          ]
        }, 'example.com');
        return expect(pageObject.getContext()).to.eql(['view', 'example.com', 'two.org', 'one.org']);
      });
      it('should have context without duplicates', function() {
        var pageObject;
        pageObject = newPage({
          journal: [
            {
              type: 'fork',
              site: 'one.org'
            }, {
              type: 'fork',
              site: 'one.org'
            }
          ]
        }, 'example.com');
        return expect(pageObject.getContext()).to.eql(['view', 'example.com', 'one.org']);
      });
      return it('should have neighbors from site, reference and journal (in order, without duplicates)', function() {
        var pageObject;
        pageObject = newPage({
          story: [
            {
              type: 'reference',
              site: 'one.org'
            }, {
              type: 'reference',
              site: 'two.org'
            }, {
              type: 'reference',
              site: 'one.org'
            }
          ],
          journal: [
            {
              type: 'fork',
              site: 'three.org'
            }, {
              type: 'fork',
              site: 'four.org'
            }, {
              type: 'fork',
              site: 'three.org'
            }
          ]
        }, 'example.com');
        console.log(pageObject.getRawPage());
        return expect(pageObject.getNeighbors()).to.eql(['example.com', 'one.org', 'two.org', 'three.org', 'four.org']);
      });
    });
  });

}).call(this);
