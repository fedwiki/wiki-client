mocha.setup('bdd');

window.wiki = require('./lib/wiki.cjs');
require('./lib/bind.cjs');
require('./lib/plugins.cjs');


require('./test/util.cjs');
require('./test/active.cjs');
require('./test/pageHandler.cjs');
require('./test/page.cjs');
require('./test/refresh.cjs');
require('./test/plugin.cjs');
require('./test/revision.cjs');
require('./test/neighborhood.cjs');
require('./test/search.cjs');
require('./test/drop.cjs');
require('./test/lineup.cjs');
require('./test/wiki.cjs');
require('./test/random.cjs');


$(function() {
  $('<hr><h2> Testing artifacts:</h2>').appendTo('body');
  mocha.run();
});
