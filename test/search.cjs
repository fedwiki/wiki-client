// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const createSearch = require('../lib/search.cjs');

describe('search', () => // Can't test for right now, because performing a search
// does DOM manipulation to build a page, which fails in the test runner. We'd like to isolate that DOM manipulation, but can't right now.
it.skip('performs a search on the neighborhood', function() {
  const spyNeighborhood = {
    search: sinon.stub().returns([])
  };
  const search = createSearch({ neighborhood: spyNeighborhood });
  search.performSearch( 'some search query' );

  expect( spyNeighborhood.search.called ).to.be(true);
  return expect( spyNeighborhood.search.args[0][0] ).to.be('some search query');
}));
