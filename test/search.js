(function() {
  var createSearch;

  createSearch = require('../lib/search');

  describe('search', function() {
    return xit('performs a search on the neighborhood', function() {
      var search, spyNeighborhood;
      spyNeighborhood = {
        search: sinon.stub().returns([])
      };
      search = createSearch({
        neighborhood: spyNeighborhood
      });
      search.performSearch('some search query');
      expect(spyNeighborhood.search.called).to.be(true);
      return expect(spyNeighborhood.search.args[0][0]).to.be('some search query');
    });
  });

}).call(this);

/*
//@ sourceMappingURL=search.js.map
*/