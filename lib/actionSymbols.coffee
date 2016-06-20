# We use unicode characters as icons for actions
# in the journal. Fork and add are also button
# labels used for user actions leading to forks
# and adds. How poetic.

# Page keeps its own list of symbols used as journal
# action separators.

symbols =
  create: '☼'
  add: '+'
  edit: '✎'
  fork: '⚑'
  move: '↕'
  remove: '✕'
  pin: '📌'
  clock: '🕑'
  closeAll: '∅'

fork = symbols['fork']
add = symbols['add']
close = symbols['remove']
pin = symbols['pin']
clock = symbols['clock']
closeAll = symbols['closeAll']

module.exports = {symbols, fork, add, close, pin, clock, closeAll}
