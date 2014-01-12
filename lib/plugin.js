(function() {
  var getScript, plugin, scripts, util, wiki;

  util = require('./util');

  wiki = require('./wiki');

  module.exports = plugin = {};

  scripts = {};

  getScript = wiki.getScript = function(url, callback) {
    if (callback == null) {
      callback = function() {};
    }
    if (scripts[url] != null) {
      return callback();
    } else {
      return $.getScript(url).done(function() {
        scripts[url] = true;
        return callback();
      }).fail(function() {
        return callback();
      });
    }
  };

  plugin.get = wiki.getPlugin = function(name, callback) {
    if (window.plugins[name]) {
      return callback(window.plugins[name]);
    }
    return getScript("/plugins/" + name + "/" + name + ".js", function() {
      if (window.plugins[name]) {
        return callback(window.plugins[name]);
      }
      return getScript("/plugins/" + name + ".js", function() {
        return callback(window.plugins[name]);
      });
    });
  };

  plugin["do"] = wiki.doPlugin = function(div, item, done) {
    var error;
    if (done == null) {
      done = function() {};
    }
    error = function(ex) {
      var errorElement;
      errorElement = $("<div />").addClass('error');
      errorElement.text(ex.toString());
      return div.append(errorElement);
    };
    div.data('pageElement', div.parents(".page"));
    div.data('item', item);
    return plugin.get(item.type, function(script) {
      var err;
      try {
        if (script == null) {
          throw TypeError("Can't find plugin for '" + item.type + "'");
        }
        if (script.emit.length > 2) {
          return script.emit(div, item, function() {
            script.bind(div, item);
            return done();
          });
        } else {
          script.emit(div, item);
          script.bind(div, item);
          return done();
        }
      } catch (_error) {
        err = _error;
        wiki.log('plugin error', err);
        error(err);
        return done();
      }
    });
  };

  wiki.registerPlugin = function(pluginName, pluginFn) {
    return window.plugins[pluginName] = pluginFn($);
  };

  window.plugins = {
    reference: require('./reference'),
    factory: require('./factory'),
    paragraph: {
      emit: function(div, item) {
        var text, _i, _len, _ref, _results;
        _ref = item.text.split(/\n\n+/);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          text = _ref[_i];
          if (text.match(/\S/)) {
            _results.push(div.append("<p>" + (wiki.resolveLinks(text)) + "</p>"));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      },
      bind: function(div, item) {
        return div.dblclick(function() {
          return wiki.textEditor(div, item, null, true);
        });
      }
    },
    image: {
      emit: function(div, item) {
        item.text || (item.text = item.caption);
        return div.append("<img class=thumbnail src=\"" + item.url + "\"> <p>" + (wiki.resolveLinks(item.text)) + "</p>");
      },
      bind: function(div, item) {
        div.dblclick(function() {
          return wiki.textEditor(div, item);
        });
        return div.find('img').dblclick(function() {
          return wiki.dialog(item.text, this);
        });
      }
    },
    future: {
      emit: function(div, item) {
        var info, _i, _len, _ref, _results;
        div.append("" + item.text + "<br><br><button class=\"create\">create</button> new blank page");
        if (((info = wiki.neighborhood[location.host]) != null) && (info.sitemap != null)) {
          _ref = info.sitemap;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            if (item.slug.match(/-template$/)) {
              _results.push(div.append("<br><button class=\"create\" data-slug=" + item.slug + ">create</button> from " + (wiki.resolveLinks("[[" + item.title + "]]"))));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      },
      bind: function(div, item) {}
    }
  };

}).call(this);

/*
//@ sourceMappingURL=plugin.js.map
*/