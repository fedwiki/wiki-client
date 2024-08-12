// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// A wiki page has a journal of actions that have been completed.
// The addToJournal function is called when the origin server
// response that the network operation is complete.

const util = require('./util');
const actionSymbols = require('./actionSymbols');

module.exports = function($journal, action) {
  const $page = $journal.parents('.page:first');
  const $action = $("<a href=\"#\" /> ").addClass("action").addClass(action.type || 'separator')
    .text(action.symbol || actionSymbols.symbols[action.type])
    .attr('title',util.formatActionTitle(action))
    .attr('data-id', action.id || "0")
    .attr('data-date', action.date || "0")
    .data('action', action);
  if ((action.type === 'add') && (action.attribution != null)) {
    $action.text(actionSymbols.symbols['copyIn']);
    if (action.attribution.site != null) { $action.css("background-image", `url(${wiki.site(action.attribution.site).flag()})`); }
  }
  if ((action.type === 'remove') && (action.removedTo != null)) {
    $action.text(actionSymbols.symbols['copyOut']);
  }
  const controls = $journal.children('.control-buttons');
  if (controls.length > 0) {
    $action.insertBefore(controls);
  } else {
    $action.appendTo($journal);
  }
  if ((action.type === 'fork') && (action.site != null)) {
    return $action
      .css("background-image", `url(${wiki.site(action.site).flag()}`)
      .attr("href", `${wiki.site(action.site).getDirectURL($page.attr('id'))}.html`)
      .attr("target", `${action.site}`)
      .data("site", action.site)
      .data("slug", $page.attr('id'));
  }
};
