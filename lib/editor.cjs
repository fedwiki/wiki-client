// Editor provides a small textarea for editing wiki markup.
// It can split and join paragraphs markup but leaves other
// types alone assuming they will interpret multiple lines.

const plugin = require('./plugin.cjs');
const itemz = require('./itemz.cjs');
const pageHandler = require('./pageHandler.cjs');
const link = require('./link.mjs');
const {itemId} = require('./random.mjs');


// Editor takes a div and an item that goes in it.
// Options manage state during splits and joins.
// Options are available to plugins but rarely used.
//
//   caret: position -- sets the cursor at the point of join
//   append: true -- sets the cursor to end and scrolls there
//   after: id -- new item to be added after id
//   sufix: text -- editor opens with unsaved suffix appended
//   field: 'text' -- editor operates on this field of the item

const escape = string => string
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

var textEditor = function($item, item, option) {
  // console.log 'textEditor', item.id, option
  let enterCount;
  if (option == null) { option = {}; }
  if (item.type === 'markdown') { enterCount = 0; }
  if (!$('.editEnable').is(':visible')) { return; }

  const keydownHandler = function(e) {

    if (e.which === 27) { //esc for save
      e.preventDefault();
      $textarea.trigger('focusout');
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && (e.which === 83)) { //ctrl-s for save
      e.preventDefault();
      $textarea.trigger('focusout');
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && (e.which === 73)) { //ctrl-i for information
      let page;
      e.preventDefault();
      if (!e.shiftKey) { page = $(e.target).parents('.page'); }
      link.doInternalLink(`about ${item.type} plugin`, page);
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && (e.which === 77)) { //ctrl-m for menu
      e.preventDefault();
      $item.removeClass(item.type).addClass(item.type = 'factory');
      $textarea.trigger('focusout');
      return false;
    }

    // provides automatic new paragraphs on enter and concatenation on backspace
    if ((item.type === 'paragraph') || (item.type === 'markdown')) {
      let suffix;
      const sel = getSelectionPos($textarea); // position of caret or selected text coords

      if ((e.which === $.ui.keyCode.BACKSPACE) && (sel.start === 0) && (sel.start === sel.end)) {
        const $previous = $item.prev();
        const previous = itemz.getItem($previous);
        if (previous.type !== item.type) { return false; }
        const caret = previous[option.field||'text'].length;
        suffix = $textarea.val();
        $textarea.val(''); // Need current text area to be empty. Item then gets deleted.
        textEditor($previous, previous, {caret, suffix});
        return false;
      }

      if (e.which === $.ui.keyCode.ENTER) {
        // console.log "Type: #{item.type}, enterCount: #{enterCount}"
        if (!sel) { return false; }
        if (item.type === 'markdown') {
          enterCount++;
        }
        // console.log "Type: #{item.type}, enterCount: #{enterCount}"
        if ((item.type === 'paragraph') || ((item.type === 'markdown') && (enterCount === 2))) {
          const $page = $item.parents('.page');
          const text = $textarea.val();
          const prefix = text.substring(0, sel.start).trim();
          suffix = text.substring(sel.end).trim();
          if (prefix === '') {
            $textarea.val(suffix);
            $textarea.trigger('focusout');
            spawnEditor($page, $item.prev(), item.type, prefix);
          } else {
            $textarea.val(prefix);
            $textarea.trigger('focusout');
            spawnEditor($page, $item, item.type, suffix);
          }
          return false;
        }
      } else {
        if (item.type === 'markdown') { enterCount = 0; }
      }
    }
  };

  const focusoutHandler = function() {
    $item.removeClass('textEditing');
    $textarea.off();
    const $page = $item.parents('.page:first');
    if (item[option.field||'text'] = $textarea.val()) {
      // Remove output and source styling as type may have changed.
      $item.removeClass("output-item");
      $item.removeClass((_index, className) => (className.match(/\S+-source/) || []).join(" "));
      plugin.do($item.empty(), item);
      if (option.after) {
        if (item[option.field||'text'] === '') { return; }
        pageHandler.put($page, {type: 'add', id: item.id, item, after: option.after});
      } else {
        if (item[option.field||'text'] === original) { return; }
        pageHandler.put($page, {type: 'edit', id: item.id, item});
      }
    } else {
      if (!option.after) {
        pageHandler.put($page, {type: 'remove', id: item.id});
      }
      const index = $(".item").index($item);
      $item.remove();
      plugin.renderFrom(index);
    }
  };

  if ($item.hasClass('textEditing')) { return; }
  $item.addClass('textEditing');
  $item.off();
  var original = item[option.field||'text'] || '';
  var $textarea = $(`<textarea>${escape(original)}${escape(option.suffix || '')}</textarea>`)
    .on('focusout', focusoutHandler)
    .on('keydown', keydownHandler);
  $item.html($textarea);
  if (option.caret) {
    setCaretPosition($textarea, option.caret);
  } else if (option.append) { // we want the caret to be at the end
    setCaretPosition($textarea, $textarea.val().length);
    //scrolls to bottom of text area
    $textarea.scrollTop($textarea[0].scrollHeight - $textarea.height());
  } else {
    $textarea.trigger('focus');
  }
};

var spawnEditor = function($page, $before, type, text) {
  const item = {
    type,
    id: itemId(),
    text
  };
  const $item = $(`<div class="item ${item.type}" data-id=${item.id}></div>`);
  $item
    .data('item', item)
    .data('pageElement', $page);
  $before.after($item);
  const before = itemz.getItem($before);
  textEditor($item, item, {after: before?.id});
};


// If the selection start and selection end are both the same,
// then you have the caret position. If there is selected text,
// the browser will not tell you where the caret is, but it will
// either be at the beginning or the end of the selection
// (depending on the direction of the selection).

var getSelectionPos = function($textarea) {
  const el = $textarea.get(0); // gets DOM Node from from jQuery wrapper
  if (document.selection) { // IE
    el.focus();
    const sel = document.selection.createRange();
    sel.moveStart('character', -el.value.length);
    const iePos = sel.text.length;
    return {start: iePos, end: iePos};
  } else {
    return {start: el.selectionStart, end: el.selectionEnd};
  }
};

var setCaretPosition = function($textarea, caretPos) {
  const el = $textarea.get(0);
  if (el) {
    if (el.createTextRange) { // IE
      const range = el.createTextRange();
      range.move("character", caretPos);
      range.select();
    } else { // rest of the world
      el.setSelectionRange(caretPos, caretPos);
    }
    el.focus();
  }
};

// # may want special processing on paste eventually
// textarea.bind 'paste', (e) ->
//   console.log 'textedit paste', e
//   console.log e.originalEvent.clipboardData.getData('text')

module.exports = {textEditor};
