// This module interprets journal actions in order to update
// a story or even regenerate a complete story from some or
// all of a journal.

const apply = function(page, action) {

  let index;
  const order = () => (page.story||[]).map((item) => item?.id);

  const add = function(after, item) {
    const index = order().indexOf(after) + 1;
    page.story.splice(index, 0, item);
  };

  const remove = function() {
    let index;
    if ((index = order().indexOf(action.id)) !== -1) {
      page.story.splice(index,1);
    }
  };

  if (!page.story) { page.story = []; }

  switch (action.type) {
    case 'create':
      if (action.item) {
        if (action.item.title) { page.title = action.item.title; }
        if (action.item.story) { page.story = action.item.story.slice(); }
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
  page.journal.push(action);
};

const create = function(revIndex, data) {
  revIndex = +revIndex;
  const revJournal = data.journal.slice(0, +revIndex + 1 || undefined);
  const revPage = {title: data.title, story: []};
  for (var action of revJournal) {
    apply(revPage, action||{});
  }
  return revPage;
};

module.exports = {create, apply};
