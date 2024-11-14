// The synopsis module extracts a summary from the json derrived
// representation of a page. This might be from a "synopsys:" field,
// but more likely it comes from text found in the first or second item.

export default function(page) {
  let { synopsis } = page;
  if (page?.story) {
    const p1 = page.story[0];
    const p2 = page.story[1];
    if (p1 && (p1.type === 'paragraph')) { synopsis ||= p1.text }
    if (p2 && (p2.type === 'paragraph')) { synopsis ||= p2.text }
    if (p1 && p1.text) { synopsis ||= p1.text }
    if (p2 && p2.text) { synopsis ||= p2.text; }
    synopsis ||= (page.story && `A page with ${page.story.length} items.`)
  } else {
    synopsis = 'A page with no story.';
  }
  // discard anything after the first line break, after trimming any at beginning
  synopsis = synopsis.trim().split(/\r|\n/, 1)[0];
  return synopsis.substring(0, 560);
};
