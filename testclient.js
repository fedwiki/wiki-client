/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
mocha.setup('bdd');

window.wiki = require('./lib/wiki');
require('./lib/bind');
require('./lib/plugins');


require('./test/util');
require('./test/active');
require('./test/pageHandler');
require('./test/page');
require('./test/refresh');
require('./test/plugin');
require('./test/revision');
require('./test/neighborhood');
require('./test/search');
require('./test/drop');
require('./test/lineup');
require('./test/wiki');
require('./test/random');


$(function() {
  $('<hr><h2> Testing artifacts:</h2>').appendTo('body');
  return mocha.run();
});

