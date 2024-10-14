// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// Target handles hovers over items and actions. Other visible
// items and actions with the same id will highlight. In some cases
// an event is generated inviting other pages to scroll the item
// into view. Target tracks hovering even when not requested so
// that highlighting can be immediate when requested.

let targeting = false;
let $item = null;
let item = null;
let itemElem = null;
let action = null;
let consumed = null;



const bind = function() {
  $(document)
    .on('keydown', function(e) { if (e.keyCode === 16) { return startTargeting(e); } })
    .on('keyup', function(e) { if (e.keyCode === 16) { return stopTargeting(e); } });
  return $('.main')
    .on('mouseenter', '.item', enterItem)
    .on('mouseleave', '.item', leaveItem)
    .on('mouseenter', '.action', enterAction)
    .on('mouseleave', '.action', leaveAction)
    .on('align-item', '.page', alignItem)
    .on('mouseenter', '.backlinks .remote', enterBacklink)
    .on('mouseleave', '.backlinks .remote', leaveBacklink);
};


var startTargeting = function(e) {
  targeting = e.shiftKey;
  if (targeting && $item) {
    let id;
    $('.emit').addClass('highlight');
    if (id = item || action) {
      let $page;
      $(`[data-id=${id}]`).addClass('target');
      const key = ($page = $(this).parents('.page:first')).data('key');
      const place = $item.offset().top;
      $('.page').trigger('align-item', {key, id:item, place});
    }
    if (itemElem) {
      consumed = itemElem.consuming;
      if (consumed) {
        return consumed.forEach(i => itemFor(i).addClass('consumed'));
      }
    }
  }
};



var stopTargeting = function(e) {
  targeting = e.shiftKey;
  if (!targeting) {
    $('.emit').removeClass('highlight');
    $('.item, .action').removeClass('target');
    return $('.item').removeClass('consumed');
  }
};

const pageFor = function(pageKey) {
  const $page = $('.page').filter((_i, page) => $(page).data('key') === pageKey);
  if ($page.length === 0) { return null; }
  if ($page.length > 1) { console.log('warning: more than one page found for', key, $page); }
  return $page;
};

var itemFor = function(pageItem) {
  const [pageKey, _item] = pageItem.split('/');
  const $page = pageFor(pageKey);
  if (!$page) { return null; }
  $item = $page.find(`.item[data-id=${_item}]`);
  if ($item.length === 0) { return null; }
  if ($item.length > 1) { console.log('warning: more than one item found for', pageItem, $item); }
  return $item;
};

var enterItem = function(e) {
  item = ($item = $(this)).attr('data-id');
  itemElem = $item[0];
  if (targeting) {
    let $page;
    $(`[data-id=${item}]`).addClass('target');
    const key = ($page = $(this).parents('.page:first')).data('key');
    const place = $item.offset().top;
    $('.page').trigger('align-item', {key, id:item, place});
    consumed = itemElem.consuming;
    if (consumed) {
      return consumed.forEach(i => itemFor(i).addClass('consumed'));
    }
  }
};


var leaveItem = function(e) {
  if (targeting) {
    $('.item, .action').removeClass('target');
    $('.item').removeClass('consumed');
  }
  item = null;
  $item = null;
  return itemElem = null;
};



var enterAction = function(e) {
  action = $(this).data('id');
  if (targeting) {
    $(`[data-id=${action}]`).addClass('target');
    const key = $(this).parents('.page:first').data('key');
    return $('.page').trigger('align-item', {key, id:action});
  }
};

var leaveAction = function(e) {
  if (targeting) {
    $(`[data-id=${action}]`).removeClass('target');
  }
  return action = null;
};


var enterBacklink = function(e) {
  item = ($item = $(this)).attr('data-id');
  itemElem = $item[0];
  if (targeting) {
    let $page;
    $(`[data-id=${item}]`).addClass('target');
    const key = ($page = $(this).parents('.page:first')).data('key');
    const place = $item.offset().top;
    return $('.page').trigger('align-item', {key, id: item, place});
  }
};

var leaveBacklink = function(e) {
  if (targeting) {
    $('.item, .action').removeClass('target');
  }
  item = null;
  return itemElem = null;
};

var alignItem = function(e, align) {
  const $page = $(this);
  if ($page.data('key') === align.key) { return; }
  $item = $page.find(`.item[data-id=${align.id}]`);
  if (!$item.length) { return; }
  const place = align.place || ($page.height()/2);
  const offset = ($item.offset().top + $page.scrollTop()) - place;
  return $page.stop().animate({scrollTop: offset}, 'slow');
};



module.exports = {bind};
