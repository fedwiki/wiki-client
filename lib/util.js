(function() {
  var util, wiki;

  wiki = require('./wiki');

  module.exports = wiki.util = util = {};

  util.symbols = {
    create: '☼',
    add: '+',
    edit: '✎',
    fork: '⚑',
    move: '↕',
    remove: '✕'
  };

  util.randomByte = function() {
    return (((1 + Math.random()) * 0x100) | 0).toString(16).substring(1);
  };

  util.randomBytes = function(n) {
    return ((function() {
      var _i, _results;
      _results = [];
      for (_i = 1; 1 <= n ? _i <= n : _i >= n; 1 <= n ? _i++ : _i--) {
        _results.push(util.randomByte());
      }
      return _results;
    })()).join('');
  };

  util.formatTime = function(time) {
    var am, d, h, mi, mo;
    d = new Date((time > 10000000000 ? time : time * 1000));
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    h = d.getHours();
    am = h < 12 ? 'AM' : 'PM';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    return "" + h + ":" + mi + " " + am + "<br>" + (d.getDate()) + " " + mo + " " + (d.getFullYear());
  };

  util.formatDate = function(msSinceEpoch) {
    var am, d, day, h, mi, mo, sec, wk, yr;
    d = new Date(msSinceEpoch);
    wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    day = d.getDate();
    yr = d.getFullYear();
    h = d.getHours();
    am = h < 12 ? 'AM' : 'PM';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    sec = (d.getSeconds() < 10 ? "0" : "") + d.getSeconds();
    return "" + wk + " " + mo + " " + day + ", " + yr + "<br>" + h + ":" + mi + ":" + sec + " " + am;
  };

  util.formatElapsedTime = function(msSinceEpoch) {
    var days, hrs, mins, months, msecs, secs, weeks, years;
    msecs = new Date().getTime() - msSinceEpoch;
    if ((secs = msecs / 1000) < 2) {
      return "" + (Math.floor(msecs)) + " milliseconds ago";
    }
    if ((mins = secs / 60) < 2) {
      return "" + (Math.floor(secs)) + " seconds ago";
    }
    if ((hrs = mins / 60) < 2) {
      return "" + (Math.floor(mins)) + " minutes ago";
    }
    if ((days = hrs / 24) < 2) {
      return "" + (Math.floor(hrs)) + " hours ago";
    }
    if ((weeks = days / 7) < 2) {
      return "" + (Math.floor(days)) + " days ago";
    }
    if ((months = days / 31) < 2) {
      return "" + (Math.floor(weeks)) + " weeks ago";
    }
    if ((years = days / 365) < 2) {
      return "" + (Math.floor(months)) + " months ago";
    }
    return "" + (Math.floor(years)) + " years ago";
  };

  util.emptyPage = function() {
    return {
      title: 'empty',
      story: [],
      journal: []
    };
  };

  util.getSelectionPos = function(jQueryElement) {
    var el, iePos, sel;
    el = jQueryElement.get(0);
    if (document.selection) {
      el.focus();
      sel = document.selection.createRange();
      sel.moveStart('character', -el.value.length);
      iePos = sel.text.length;
      return {
        start: iePos,
        end: iePos
      };
    } else {
      return {
        start: el.selectionStart,
        end: el.selectionEnd
      };
    }
  };

  util.setCaretPosition = function(jQueryElement, caretPos) {
    var el, range;
    el = jQueryElement.get(0);
    if (el != null) {
      if (el.createTextRange) {
        range = el.createTextRange();
        range.move("character", caretPos);
        range.select();
      } else {
        el.setSelectionRange(caretPos, caretPos);
      }
      return el.focus();
    }
  };

}).call(this);

/*
//@ sourceMappingURL=util.js.map
*/