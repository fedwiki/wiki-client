// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
// We use unicode characters as icons for actions
// in the journal. Fork and add are also button
// labels used for user actions leading to forks
// and adds. How poetic.

// Page keeps its own list of symbols used as journal
// action separators.

export default class {
  static symbols = {
      create: '☼',
      add: '+',
      edit: '✎',
      fork: '⚑',
      move: '↕',
      remove: '✕',
      copyIn: '⨭',
      copyOut: '⨵'
    };
  static fork = '⚑';
  static add  = '+';
}

