// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
window.name = window.location.host;

window.wiki = require('./lib/wiki.cjs');
require('./lib/legacy.cjs');
require('./lib/bind.cjs');
require('./lib/plugins.cjs');
