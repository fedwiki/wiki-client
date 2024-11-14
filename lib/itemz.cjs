// The itemz module understands how we have been keeping track of
// story items and their corresponding divs. It offers utility
// functions used elsewere. We anticipate a more proper model eventually.

const pageHandler = require('./pageHandler.cjs');
const plugin = require('./plugin.cjs');
const {itemId} = require('./random.mjs');


const sleep = (time, done) => setTimeout(done, time);

const getItem = function($item) {
  if ($($item).length > 0) { return $($item).data("item") || $($item).data('staticItem'); }
};

const removeItem = function($item, item) {
  pageHandler.put($item.parents('.page:first'), {type: 'remove', id: item.id});
  $item.remove();
};

const createItem = function($page, $before, item) {
  if (!$page) { $page = $before.parents('.page'); }
  item.id = itemId();
  const $item = $(`\
<div class="item ${item.type}" data-id=""</div>\
`
  );
  $item
    .data('item', item)
    .data('pageElement', $page);
  if ($before) {
    $before.after($item);
  } else {
    $page.find('.story').append($item);
  }
  plugin.do($item, item);
  const before = getItem($before);
  // TODO: can we remove this sleep with better synchronization?
  sleep(500, () => pageHandler.put($page, {item, id: item.id, type: 'add', after: before?.id}));
  return $item;
};

const replaceItem = function($item, type, item) {
  const newItem = $.extend({}, item);
  $item.empty().off();
  $item.removeClass(type).addClass(newItem.type);
  const $page = $item.parents('.page:first');
  try {
    $item.data('pageElement', $page);
    $item.data('item', newItem);
    plugin.getPlugin(item.type, function(plugin) {
      plugin.emit($item, newItem);
      plugin.bind($item, newItem);
    });
  } catch (err) {
    $item.append(`<p class='error'>${err}</p>`);
  }
  return pageHandler.put($page, {type: 'edit', id: newItem.id, item: newItem});
};

module.exports = {createItem, removeItem, getItem, replaceItem};
