/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The synopsis module extracts a summary from the json derrived
// representation of a page. This might be from a "synopsys:" field,
// but more likely it comes from text found in the first or second item.

module.exports = function(page) {
  let {
    synopsis
  } = page;
  if ((page != null) && (page.story != null)) {
    const p1 = page.story[0];
    const p2 = page.story[1];
    if (p1 && (p1.type === 'paragraph')) { if (!synopsis) { synopsis = p1.text; } }
    if (p2 && (p2.type === 'paragraph')) { if (!synopsis) { synopsis = p2.text; } }
    if (p1 && (p1.text != null)) { if (!synopsis) { synopsis = p1.text; } }
    if (p2 && (p2.text != null)) { if (!synopsis) { synopsis = p2.text; } }
    if (!synopsis) { synopsis = (page.story != null) && `A page with ${page.story.length} items.`; }
  } else {
    synopsis = 'A page with no story.';
  }
  // discard anything after the first line break, after trimming any at beginning
  synopsis = synopsis.trim().split(/\r|\n/, 1)[0];
  return synopsis.substring(0, 560);
};
