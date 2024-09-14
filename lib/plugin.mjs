/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The plugin module manages the dynamic retrieval of plugin
// javascript including additional scripts that may be requested.

import * as forward from './forward.mjs';

import * as wiki from './wiki.mjs';

let plugin;
export default plugin = {};

const escape = s => (''+s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;')
  .replace(/\//g,'&#x2F;');

// define loadScript that allows fetching a script.
// see example in http://api.jquery.com/jQuery.getScript/

const loadScript = function(url) {
  console.log("loading url:", url);
  return import(url)
};

const scripts = [];
const loadingScripts = {};
export async function getScript (url, callback) {
  if (callback == null) { callback = function() {}; }
  if (Array.from(scripts).includes(url)) {
    return callback();
  } else {

    try {
      await loadScript(url)
    } catch (err) {
      console.log('getScript: Failed to load:', url, err);
    }

    scripts.push(url);
    return callback();
  }
};

export async function renderFrom (notifIndex) {
  const $items = $(".item").slice(notifIndex);
  
  // console.log "notifIndex", notifIndex, "about to render", $items.toArray()

  for (const itemElem of $items.toArray()) {
    const $item = $(itemElem);
    if (!$item.hasClass('textEditing')) {
      const item = $item.data('item');
      try {
        $item.off();
        await emit($item.empty(), item)
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Binds must be called sequentially in order to store the promises used to order bind operations.
  // Note: The bind promises used here are for ordering "bind creation".
  // The ordering of "bind results" is done within the plugin.bind wrapper.
  for (const itemElem of $items.toArray()) {
    const $item = $(itemElem);
    const item = $item.data('item');
    try {
      const p = await getPlugin(item.type)
      if (p && p.bind) {
        await p.bind($item, item);
      }
    } catch (e) {
      console.error(e)
    }
  }
}

// there is emit and emit2
const emit = function(pluginEmit) {
  const fn = function($item, item) {
    $item.addClass('emit');
    return pluginEmit($item, item);
  };
  return fn;
};

const bind = function(name, pluginBind) {
  const fn = async function($item, item ) {
    // Clear out any list of consumed items.
    $item[0].consuming = [];
    const index = $('.item').index($item);
    const {
      consumes
    } = window.plugins[name];

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
      await Promise.all(deps);
    }

    try {

      $item.removeClass('emit');
      let bindPromise = $item[0].promise = (async function () {
        return pluginBind($item, item);
      })()

      await bindPromise

      // If the plugin has the needed callback, subscribe to server side events
      // for the current page
      if (window.plugins[name].processServerEvent) {
        console.log('listening for server events', $item, item);
        forward.init($item, item, window.plugins[name].processServerEvent);
      }
    } catch (e) {
      console.log('plugin emit: unexpected error', e)
    }
  }
  return fn;
};

export function wrap (name, p) {
  p.emit = emit(p.emit);
  p.bind = bind(name, p.bind);
  return p;
}

export async function getPlugin(name, callback) {
  if (callback == null) { callback = function() {}; }
  if (window.pluginSuccessor[name]) {
    wiki.log('plugin successor', name, window.pluginSuccessor[name]);
    name = window.pluginSuccessor[name]; 
  }
  if (window.plugins[name]) {
    callback(window.plugins[name])
    return window.plugins[name]
  }
  if (!loadingScripts[name]) { 
    loadingScripts[name] = (async function() {
      if (window.plugins[name]) { return window.plugins[name]; }
      await getScript(`/plugins/${name}/${name}.js`)
      if (!window.plugins[name]) {
        await getScript(`/plugins/${name}.js`)
      }
      const p = window.plugins[name];
      if (p) {
        wrap(name, p);
      }
      return p;
    })();
  }
  const p = await loadingScripts[name]
  delete loadingScripts[name];
  if (!p) {
    console.log("Could not find plugin ", name)
  }
  callback(p)
  return p
};


// do = doPlugin
export async function doPlugin($item, item, done) {
  if (done == null) { done = function() {}; }
  $item.data('item', item);
  await renderFrom($('.item').index($item));
  return done()
};

export async function emit2(div, item, done) {
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
      div.find('.error').on('dblclick', () => wiki.textEditor(div, item));
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
  const script = await getPlugin(item.type)
  try {
    if (script == null) { throw TypeError(`Can't find plugin for '${item.type}'`); }
    if (script.emit.length > 2) {
      await new Promise(function(resolve /*, reject */) {
        script.emit(div, item, function() {
          if (script.bind) { script.bind(div, item); }
          resolve();
        });
      })
    } else {
      script.emit(div, item);
    }
  } catch (err) {
    console.log('plugin error', err);
    error(err, script);
  }
  return done();
};

export function registerPlugin (pluginName, pluginFn) { return window.plugins[pluginName] = pluginFn($); }
