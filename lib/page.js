(function() {
  var asSlug, emptyPage, newPage, nowSections, util, _;

  util = require('./util');

  _ = require('underscore');

  asSlug = function(name) {
    return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  };

  emptyPage = function() {
    return newPage({}, null);
  };

  nowSections = function(now) {
    return [
      {
        symbol: '❄',
        date: now - 1000 * 60 * 60 * 24 * 366,
        period: 'a Year'
      }, {
        symbol: '⚘',
        date: now - 1000 * 60 * 60 * 24 * 31 * 3,
        period: 'a Season'
      }, {
        symbol: '⚪',
        date: now - 1000 * 60 * 60 * 24 * 31,
        period: 'a Month'
      }, {
        symbol: '☽',
        date: now - 1000 * 60 * 60 * 24 * 7,
        period: 'a Week'
      }, {
        symbol: '☀',
        date: now - 1000 * 60 * 60 * 24,
        period: 'a Day'
      }, {
        symbol: '⌚',
        date: now - 1000 * 60 * 60,
        period: 'an Hour'
      }
    ];
  };

  newPage = function(json, site) {
    var addItem, addParagraph, getContext, getNeighbors, getRawPage, getRemoteSite, getSlug, isLocal, isPlugin, isRemote, page, seqActions, seqItems, setTitle;
    page = _.extend({}, util.emptyPage(), json);
    page.story || (page.story = []);
    page.journal || (page.journal = []);
    getRawPage = function() {
      return page;
    };
    getContext = function() {
      var action, addContext, context, _i, _len, _ref;
      context = ['view'];
      if (isRemote()) {
        context.push(site);
      }
      addContext = function(site) {
        if ((site != null) && !_.include(context, site)) {
          return context.push(site);
        }
      };
      _ref = page.journal.slice(0).reverse();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        action = _ref[_i];
        addContext(action.site);
      }
      return context;
    };
    isPlugin = function() {
      return page.plugin != null;
    };
    isRemote = function() {
      return !(site === (void 0) || site === null || site === 'view' || site === 'origin' || site === 'local');
    };
    isLocal = function() {
      return site === 'local';
    };
    getRemoteSite = function() {
      if (isRemote()) {
        return site;
      }
      return null;
    };
    getSlug = function() {
      return asSlug(page.title);
    };
    getNeighbors = function(host) {
      var action, item, neighbors, _i, _j, _len, _len1, _ref, _ref1;
      neighbors = [];
      if (isRemote()) {
        neighbors.push(site);
      } else {
        if (host != null) {
          neighbors.push(host);
        }
      }
      _ref = page.story;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (item.site != null) {
          neighbors.push(item.site);
        }
      }
      _ref1 = page.journal;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        action = _ref1[_j];
        if (action.site != null) {
          neighbors.push(action.site);
        }
      }
      return _.uniq(neighbors);
    };
    setTitle = function(title) {
      return page.title = title;
    };
    addItem = function(item) {
      item = _.extend({}, {
        id: util.randomBytes(8)
      }, item);
      return page.story.push(item);
    };
    seqItems = function(each) {
      var emitItem;
      emitItem = function(i) {
        if (i >= page.story.length) {
          return;
        }
        return each(page.story[i], function() {
          return emitItem(i + 1);
        });
      };
      return emitItem(0);
    };
    addParagraph = function(text) {
      var type;
      type = "paragraph";
      return addItem({
        type: type,
        text: text
      });
    };
    seqActions = function(each) {
      var emitAction, sections, smaller;
      smaller = 0;
      sections = nowSections((new Date).getTime());
      emitAction = function(i) {
        var action, bigger, section, separator, _i, _len;
        if (i >= page.journal.length) {
          return;
        }
        action = page.journal[i];
        bigger = action.date || 0;
        separator = null;
        for (_i = 0, _len = sections.length; _i < _len; _i++) {
          section = sections[_i];
          if (section.date > smaller && section.date < bigger) {
            separator = section;
          }
        }
        smaller = bigger;
        return each({
          action: action,
          separator: separator
        }, function() {
          return emitAction(i + 1);
        });
      };
      return emitAction(0);
    };
    return {
      getRawPage: getRawPage,
      getContext: getContext,
      isPlugin: isPlugin,
      isRemote: isRemote,
      isLocal: isLocal,
      getRemoteSite: getRemoteSite,
      getSlug: getSlug,
      getNeighbors: getNeighbors,
      setTitle: setTitle,
      addItem: addItem,
      addParagraph: addParagraph,
      seqItems: seqItems,
      seqActions: seqActions
    };
  };

  module.exports = {
    newPage: newPage,
    emptyPage: emptyPage
  };

}).call(this);
