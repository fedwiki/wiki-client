// We use unicode characters as icons for actions
// in the journal. Fork and add are also button
// labels used for user actions leading to forks
// and adds. How poetic.

// Page keeps its own list of symbols used as journal
// action separators.

const symbols = {
  create: '☼',
  add: '+',
  edit: '✎',
  fork: '⚑',
  move: '↕',
  remove: '✕',
  copyIn: '⨭',
  copyOut: '⨵'
};

const fork = symbols['fork'];
const add = symbols['add'];

module.exports = {symbols, fork, add};