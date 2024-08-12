createSearch = require '../lib/search'

describe 'search', ->
  # Can't test for right now, because performing a search
  # does DOM manipulation to build a page, which fails in the test runner. We'd like to isolate that DOM manipulation, but can't right now.
  it.skip 'performs a search on the neighborhood', ->
    spyNeighborhood = {
      search: sinon.stub().returns([])
    }
    search = createSearch( neighborhood: spyNeighborhood )
    search.performSearch( 'some search query' )

    expect( spyNeighborhood.search.called ).to.be(true)
    expect( spyNeighborhood.search.args[0][0] ).to.be('some search query')
