mocha.setup('bdd')

window.wiki = require('./lib/wiki')

require('./test/util')
require('./test/active')
require('./test/pageHandler')
require('./test/page')
require('./test/refresh')
require('./test/plugin')
require('./test/revision')
require('./test/neighborhood')
require('./test/search')

$ ->
  $('<hr><h2> Testing artifacts:</h2>').appendTo('body')
  mocha.run()

