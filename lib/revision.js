/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// This module interprets journal actions in order to update
// a story or even regenerate a complete story from some or
// all of a journal.

const apply = function(page, action) {

  let index;
  const order = () => Array.from(page.story||[]).map((item) => (item != null ? item.id : undefined));

  const add = function(after, item) {
    const index = order().indexOf(after) + 1;
    return page.story.splice(index, 0, item);
  };

  const remove = function() {
    let index;
    if ((index = order().indexOf(action.id)) !== -1) {
      return page.story.splice(index,1);
    }
  };

  if (!page.story) { page.story = []; }

  switch (action.type) {
    case 'create':
      if (action.item != null) {
        if (action.item.title != null) { page.title = action.item.title; }
        if (action.item.story != null) { page.story = action.item.story.slice(); }
      }
      break;
    case 'add':
      add(action.after, action.item);
      break;
    case 'edit':
      if ((index = order().indexOf(action.id)) !== -1) {
        page.story.splice(index,1,action.item);
      } else {
        page.story.push(action.item);
      }
      break;
    case 'move':
      // construct relative addresses from absolute order
      index = action.order.indexOf(action.id);
      var after = action.order[index-1];
      var item = page.story[order().indexOf(action.id)];
      remove();
      add(after, item);
      break;
    case 'remove':
      remove();
      break;
  }

  if (!page.journal) { page.journal = []; }
  if (action.fork) {
    // implicit fork
    page.journal.push({type: 'fork', site: action.fork, date: action.date - 1 });
  }
  return page.journal.push(action);
};

const create = function(revIndex, data) {
  revIndex = +revIndex;
  const revJournal = data.journal.slice(0, +revIndex + 1 || undefined);
  const revPage = {title: data.title, story: []};
  for (var action of Array.from(revJournal)) {
    apply(revPage, action||{});
  }
  return revPage;
};

module.exports = {create, apply};