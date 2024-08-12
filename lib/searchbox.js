/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// Handle input events from the search box. There is machinery
// here that anticipates incremental search that is yet to be coded.
// We use dependency injection to break dependency loops.

const createSearch = require('./search');

let search = null;

const inject = neighborhood => search = createSearch({neighborhood});

const bind = function() {
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

  $('input.search').on('focus', function(e){
    const searchQuery = $(this).val();
    return search.incrementalSearch( searchQuery );
  });

  return $('input.search').on('input', function(e){
    const searchQuery = $(this).val();
    return search.incrementalSearch( searchQuery );
  });
};

module.exports = {inject, bind};
