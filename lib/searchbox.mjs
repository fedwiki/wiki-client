// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// Handle input events from the search box. There is machinery
// here that anticipates incremental search that is yet to be coded.
// We use dependency injection to break dependency loops.

import { createSearch } from './search.mjs';

let search = null;

export function inject ( neighborhood ) { return search = createSearch({neighborhood}); }

export function bind () {
  $('input.search').attr('autocomplete', 'off');
  $('input.search').on('keydown', function(e){
    if (e.keyCode === 27) {
      return $('.incremental-search').remove();
    }
  });
  $('input.search').on('keypress', function(e){
    if (e.keyCode !== 13) { return; } // 13 == return
    const searchQuery = $(this).val();
    search.performSearch( searchQuery );
    return $(this).val("");
  });

  $('input.search').on('focus', function(){
    const searchQuery = $(this).val();
    return search.incrementalSearch( searchQuery );
  });

  return $('input.search').on('input', function(){
    const searchQuery = $(this).val();
    return search.incrementalSearch( searchQuery );
  });
};

