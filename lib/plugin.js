/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The plugin module manages the dynamic retrieval of plugin
// javascript including additional scripts that may be requested.

// forward = require './forward'

let plugin;
module.exports = (plugin = {});

const escape = s => (''+s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;')
  .replace(/\//g,'&#x2F;');

// define loadScript that allows fetching a script.
// see example in http://api.jquery.com/jQuery.getScript/

const loadScript = function(url, options) {
  console.log("loading url:", url);
  options = $.extend(options || {}, {
    dataType: "script",
    cache: true,
    url
  }
  );
  return $.ajax(options);
};

const scripts = [];
const loadingScripts = {};
const getScript = (plugin.getScript = function(url, callback) {
  if (callback == null) { callback = function() {}; }
  if (Array.from(scripts).includes(url)) {
    return callback();
  } else {
    return loadScript(url)
      .done(function() {
        scripts.push(url);
        return callback();}).fail(function(_jqXHR, _textStatus, err) {
        console.log('getScript: Failed to load:', url, err);
        return callback();
    });
  }
});

plugin.renderFrom = function(notifIndex) {
  const $items = $(".item").slice(notifIndex);
  
  // console.log "notifIndex", notifIndex, "about to render", $items.toArray()
  let promise = Promise.resolve();
  var emitNextItem = function(itemElems) {
    if (itemElems.length === 0) { return promise; }
    const itemElem = itemElems.shift();
    const $item = $(itemElem);
    if (!$item.hasClass('textEditing')) {
      const item = $item.data('item');
      promise = promise.then(() => new Promise(function(resolve, reject) {
        $item.off();
        return plugin.emit($item.empty(), item, () => resolve());
      }));
    }
    return emitNextItem(itemElems);
  };
  // The concat here makes a copy since we need to loop through the same
  // items to do a bind.
  promise = emitNextItem($items.toArray());
  // Binds must be called sequentially in order to store the promises used to order bind operations.
  // Note: The bind promises used here are for ordering "bind creation".
  // The ordering of "bind results" is done within the plugin.bind wrapper.
  promise = promise.then(function() {
    promise = Promise.resolve();
    var bindNextItem = function(itemElems) {
      if (itemElems.length === 0) { return promise; }
      const itemElem = itemElems.shift();
      const $item = $(itemElem);
      const item = $item.data('item');
      promise = promise.then(() => new Promise((resolve, reject) => plugin.getPlugin(item.type, function(plugin) {
        plugin.bind($item, item);
        return resolve();
      })));
      return bindNextItem(itemElems);
    };
    return bindNextItem($items.toArray());
  });
  return promise;
};

const emit = function(pluginEmit) {
  const fn = function($item, item) {
    $item.addClass('emit');
    return pluginEmit($item, item);
  };
  return fn;
};

const bind = function(name, pluginBind) {
  const fn = function($item, item, oldIndex) {
    // Clear out any list of consumed items.
    $item[0].consuming = [];
    const index = $('.item').index($item);
    const {
      consumes
    } = window.plugins[name];
    let waitFor = Promise.resolve();
    // Wait for all items in the lineup that produce what we consume
    // before calling our bind method.
    if (consumes) {
      const deps = [];
      consumes.forEach(function(consuming) {
        const producers = $(`.item:lt(${index})`).filter(consuming);
        // console.log(name, "consumes", consuming)
        // console.log(producers, "produce", consuming)
        if (!producers || (producers.length === 0)) {
          console.log('warn: no items in lineup that produces', consuming);
        }
        // console.log("there are #{producers.length} instances of #{consuming}")
        return producers.each(function(_i, el) {
          const page_key = $(el).parents('.page').data('key');
          const item_id = $(el).attr('data-id');
          $item[0].consuming.push(`${page_key}/${item_id}`);
          return deps.push(el.promise);
        });
      });
      waitFor = Promise.all(deps);
    }
    return waitFor
      .then(function() {
        $item.removeClass('emit');
        let bindPromise = pluginBind($item, item);
        if (!bindPromise || (typeof(bindPromise.then) === 'function')) {
          bindPromise = Promise.resolve(bindPromise);
        }
        // This is where the "bind results" promise for the current item is stored
        return $item[0].promise = bindPromise;
      }).then(function() {
        // If the plugin has the needed callback, subscribe to server side events
        // for the current page
        if (window.plugins[name].processServerEvent) {
          console.log('listening for server events', $item, item);
          return forward.init($item, item, window.plugins[name].processServerEvent);
        }
      }).catch(e => console.log('plugin emit: unexpected error', e));
  };
  return fn;
};

plugin.wrap = function(name, p) {
  p.emit = emit(p.emit);
  p.bind = bind(name, p.bind);
  return p;
};

plugin.get = (plugin.getPlugin = function(name, callback) {
  if (window.pluginSuccessor[name]) {
    wiki.log('plugin successor', name, window.pluginSuccessor[name]);
    name = window.pluginSuccessor[name]; 
  }
  if (loadingScripts[name]) { return loadingScripts[name].then(callback); }
  loadingScripts[name] = new Promise(function(resolve, _reject) {
    if (window.plugins[name]) { return resolve(window.plugins[name]); }
    return getScript(`/plugins/${name}/${name}.js`, function() {
      let p = window.plugins[name];
      if (p) {
        plugin.wrap(name, p);
        return resolve(p);
      }
      return getScript(`/plugins/${name}.js`, function() {
        p = window.plugins[name];
        if (p) { plugin.wrap(name, p); }
        return resolve(p);
      });
    });
  });
  loadingScripts[name].then(function(plugin) {
    delete loadingScripts[name];
    return callback(plugin);
  });
  return loadingScripts[name];
});


plugin.do = (plugin.doPlugin = function($item, item, done) {
  if (done == null) { done = function() {}; }
  $item.data('item', item);
  const promise = plugin.renderFrom($('.item').index($item));
  return promise.then(() => done());
});

plugin.emit = function(div, item, done) {
  if (done == null) { done = function() {}; }
  const error = function(ex, script) {
    div.append(`\
<div class="error">
  ${escape(item.text || "")}
  <button>help</button><br>
</div>\
`
    );
    if (item.text != null) {
      div.find('.error').on('dblclick', e => wiki.textEditor(div, item));
    }
    return div.find('button').on('click', function() {
      // only append dialog if not already done.
      if (!div[0].querySelector('dialog')) {
        div.append(`\
<dialog>
  <h3>${ex.toString()}</h3>
  <p> This "${item.type}" plugin won't show.</p>
  <ul>
    <li> Is it available on this server?
    <li> Is its markup correct?
    <li> Can it find necessary data?
    <li> Has network access been interrupted?
    <li> Has its code been tested?
  </ul>
  <p> Developers may open debugging tools and retry the plugin.</p>
  <button class="retry">retry</button>  <button class="close">close</button>
  <p> Learn more
    <a class="external" target="_blank" rel="nofollow"
    href="http://plugins.fed.wiki.org/about-plugins.html"
    title="http://plugins.fed.wiki.org/about-plugins.html">
      About Plugins
      <img src="/images/external-link-ltr-icon.png">
    </a>
  </p>
 
</dialog>\
`
        );
      }
      const dialog = div[0].querySelector('dialog');
      dialog.addEventListener('click', function(evt) {
        if (evt.target === dialog) {
          return dialog.close();
        }
      });
      dialog.showModal();
      $('.close').on('click', () => dialog.close());
      return $('.retry').on('click', function() {
        if (script.emit.length > 2) {
          return script.emit(div, item, () => done());
        } else {
          script.emit(div, item);
          return done();
        }
      });
    });
  };

  div.data('pageElement', div.parents(".page"));
  div.data('item', item);
  return plugin.get(item.type, function(script) {
    try {
      if (script == null) { throw TypeError(`Can't find plugin for '${item.type}'`); }
      if (script.emit.length > 2) {
        return script.emit(div, item, function() {
          if (bind) { script.bind(div, item); }
          return done();
        });
      } else {
        script.emit(div, item);
        return done();
      }
    } catch (err) {
      console.log('plugin error', err);
      error(err, script);
      return done();
    }
  });
};

plugin.registerPlugin = (pluginName, pluginFn) => window.plugins[pluginName] = pluginFn($);
