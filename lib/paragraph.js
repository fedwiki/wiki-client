// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The Paragraph plugin holds text that can be edited and rendered
// with hyperlinks. It will eventually escape html tags but for the
// moment we live dangerously.

const editor = require('./editor');
const resolve = require('./resolve');
const itemz = require('./itemz');

const type = function(text) {
  if (text.match(/<(i|b|p|a|h\d|hr|br|li|img|div|span|table|blockquote)\b.*?>/i)) {
    return 'html';
  } else {
    return 'markdown';
  }
};

const emit = ($item, item) => (() => {
  const result = [];
  for (var text of Array.from(item.text.split(/\n\n+/))) {
    if (text.match(/\S/)) { result.push($item.append(`<p>${resolve.resolveLinks(text)}</p>`)); } else {
      result.push(undefined);
    }
  }
  return result;
})();

const bind = ($item, item) => $item.on('dblclick', function(e) {
  if (e.shiftKey) {
    item.type = type(item.text);
    return itemz.replaceItem($item, 'paragraph', item);
  } else {
    return editor.textEditor($item, item, {'append': true});
  }
});

module.exports = {emit, bind};