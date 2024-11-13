// The Paragraph plugin holds text that can be edited and rendered
// with hyperlinks. It will eventually escape html tags but for the
// moment we live dangerously.

const editor = require('./editor.cjs');
const resolve = require('./resolve.cjs');
const itemz = require('./itemz.cjs');

const type = function(text) {
  if (text.match(/<(i|b|p|a|h\d|hr|br|li|img|div|span|table|blockquote)\b.*?>/i)) {
    return 'html';
  } else {
    return 'markdown';
  }
};

const emit = ($item, item) => {
  for (var text of item.text.split(/\n\n+/)) {
    if (text.match(/\S/)) {
      $item.append(`<p>${resolve.resolveLinks(text)}</p>`)
    }
  }
}

const bind = ($item, item) => $item.on('dblclick', function(e) {
  if (e.shiftKey) {
    item.type = type(item.text);
    return itemz.replaceItem($item, 'paragraph', item);
  } else {
    return editor.textEditor($item, item, {'append': true});
  }
});

module.exports = {emit, bind};
