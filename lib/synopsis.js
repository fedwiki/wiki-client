(function() {
  module.exports = function(page) {
    var p1, p2, synopsis;
    synopsis = page.synopsis;
    if ((page != null) && (page.story != null)) {
      p1 = page.story[0];
      p2 = page.story[1];
      if (p1 && p1.type === 'paragraph') {
        synopsis || (synopsis = p1.text);
      }
      if (p2 && p2.type === 'paragraph') {
        synopsis || (synopsis = p2.text);
      }
      if (p1 && (p1.text != null)) {
        synopsis || (synopsis = p1.text);
      }
      if (p2 && (p2.text != null)) {
        synopsis || (synopsis = p2.text);
      }
      synopsis || (synopsis = (page.story != null) && ("A page with " + page.story.length + " items."));
    } else {
      synopsis = 'A page with no story.';
    }
    return synopsis;
  };

}).call(this);

/*
//@ sourceMappingURL=synopsis.js.map
*/