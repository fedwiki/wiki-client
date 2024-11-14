// Handle input events from the search box. There is machinery
// here that supports incremental search.
// We use dependency injection to break dependency loops.

import { createSearch } from './search.mjs';

export default class {
  static search = null;

  inject ( neighborhood ) { search = createSearch({neighborhood}); }

  bind () {
    $('input.search').attr('autocomplete', 'off');
    $('input.search').on('keydown', function(e){
      if (e.keyCode === 27) {
        $('.incremental-search').remove();
      }
    });
    $('input.search').on('keypress', function(e){
      if (e.keyCode !== 13) { return; } // 13 == return
      const searchQuery = $(this).val();
      search.performSearch( searchQuery );
      $(this).val("");
    });

    $('input.search').on('focus', function(_e){
      const searchQuery = $(this).val();
      search.incrementalSearch( searchQuery );
    });

    return $('input.search').on('input', function(_e){
      const searchQuery = $(this).val();
      search.incrementalSearch( searchQuery );
    });
  };
}

