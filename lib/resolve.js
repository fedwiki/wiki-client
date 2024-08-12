/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The function resolveLinks converts link markup to html syntax.
// The html will have a search path (the resolutionContext) encoded
// into the title of <a> tags it generates.

let escape, resolve;
const {
  asSlug
} = require('./page');

module.exports = (resolve = {});

resolve.resolutionContext = [];

resolve.escape = (escape = string => (string||'')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;'));

resolve.resolveFrom = function(addition, callback) {
  resolve.resolutionContext.push(addition);
  try {
    return callback();
  } finally {
    resolve.resolutionContext.pop();
  }
};

// resolveLinks takes a second argument which is a substitute text sanitizer.
// Plugins that do their own markup should insert themselves here but they
// must escape html as part of their processing. Sanitizers must pass markers〖12〗.

resolve.resolveLinks = function(string, sanitize) {
  if (sanitize == null) { sanitize = escape; }
  const stashed = [];

  const stash = function(text) {
    const here = stashed.length;
    stashed.push(text);
    return `〖${here}〗`;
  };

  const unstash = (match, digits) => stashed[+digits];

  const internal = function(match, name) {
    const slug = asSlug(name);
    const styling = name === name.trim() ? 'internal' : 'internal spaced';
    if (slug.length) {
      return stash(`<a class="${styling}" href="/${slug}.html" data-page-name="${slug}" title="${resolve.resolutionContext.join(' => ')}">${escape(name)}</a>`);
    } else {
      return match;
    }
  };

  const external = (match, href, protocol, rest) => stash(`<a class="external" target="_blank" href="${href}" title="${href}" rel="nofollow">${escape(rest)} <img src="/images/external-link-ltr-icon.png"></a>`);

  // markup conversion happens in four phases:
  //   - unexpected markers are adulterated
  //   - links are found, converted, and stashed away properly escaped
  //   - remaining text is sanitized and/or escaped
  //   - unique markers are replaced with unstashed links

  string = (string||'')
    .replace(/〖(\d+)〗/g, "〖 $1 〗")
    .replace(/\[\[([^\]]+)\]\]/gi, internal)
    .replace(/\[((http|https|ftp):.*?) (.*?)\]/gi, external);
  return sanitize(string)
    .replace(/〖(\d+)〗/g, unstash);
};


