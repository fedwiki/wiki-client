// The plugin module manages the dynamic retrieval of plugin
// javascript including additional scripts that may be requested.

let plugin
module.exports = plugin = {}

const escape = s =>
  ('' + s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

// define loadScript that allows fetching a script.
// see example in http://api.jquery.com/jQuery.getScript/

const loadScript = function (url) {
  console.log('loading url:', url)
  return import(url)
}

const scripts = []
const loadingScripts = {}
const getScript = (plugin.getScript = async function (url, callback = () => {}) {
  if (scripts.includes(url)) {
    callback()
  } else {
    try {
      await loadScript(url)
    } catch (err) {
      console.log('getScript: Failed to load:', url, err)
    }

    scripts.push(url)
    callback()
  }
})

plugin.renderFrom = async function (notifIndex) {
  const $items = $('.item').slice(notifIndex)

  // console.log "notifIndex", notifIndex, "about to render", $items.toArray()

  for (const itemElem of $items.toArray()) {
    const $item = $(itemElem)
    if (!$item.hasClass('textEditing')) {
      const item = $item.data('item')
      try {
        $item.off()
        await plugin.emit($item.empty(), item)
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Binds must be called sequentially in order to store the promises used to order bind operations.
  // Note: The bind promises used here are for ordering "bind creation".
  // The ordering of "bind results" is done within the plugin.bind wrapper.
  for (const itemElem of $items.toArray()) {
    const $item = $(itemElem)
    const item = $item.data('item')
    try {
      const p = await plugin.get(item.type)
      if (p && p.bind) {
        await p.bind($item, item)
      }
    } catch (e) {
      console.error(e)
    }
  }
}

const emit = function (pluginEmit) {
  const fn = function ($item, item) {
    $item.addClass('emit')
    return pluginEmit($item, item)
  }
  return fn
}

const bind = function (name, pluginBind) {
  const fn = async function ($item, item) {
    // Clear out any list of consumed items.
    $item[0].consuming = []
    const index = $('.item').index($item)
    const { consumes } = window.plugins[name]

    // Wait for all items in the lineup that produce what we consume
    // before calling our bind method.
    if (consumes) {
      const deps = []
      consumes.forEach(function (consuming) {
        const producers = $(`.item:lt(${index})`).filter(consuming)
        // console.log(name, "consumes", consuming)
        // console.log(producers, "produce", consuming)
        if (!producers || producers.length === 0) {
          console.log('warn: no items in lineup that produces', consuming)
        }
        // console.log("there are #{producers.length} instances of #{consuming}")
        producers.each(function (_i, el) {
          const page_key = $(el).parents('.page').data('key')
          const item_id = $(el).attr('data-id')
          $item[0].consuming.push(`${page_key}/${item_id}`)
          deps.push(el.promise)
        })
      })
      await Promise.all(deps)
    }

    try {
      $item.removeClass('emit')
      let bindPromise = ($item[0].promise = (async function () {
        return pluginBind($item, item)
      })())

      await bindPromise

      // If the plugin has the needed callback, subscribe to server side events
      // for the current page
      if (window.plugins[name].processServerEvent) {
        console.log('listening for server events', $item, item)
        //  forward.init($item, item, window.plugins[name].processServerEvent)
      }
    } catch (e) {
      console.log('plugin emit: unexpected error', e)
    }
  }
  return fn
}

plugin.wrap = wrap
function wrap(name, p) {
  p.emit = emit(p.emit)
  p.bind = bind(name, p.bind)
  return p
}

plugin.get = plugin.getPlugin = async function (name, callback = () => {}) {
  if (window.pluginSuccessor[name]) {
    wiki.log('plugin successor', name, window.pluginSuccessor[name])
    name = window.pluginSuccessor[name]
  }
  if (window.plugins[name]) {
    callback(window.plugins[name])
    return window.plugins[name]
  }
  if (!loadingScripts[name]) {
    loadingScripts[name] = (async function () {
      if (window.plugins[name]) {
        return window.plugins[name]
      }
      await getScript(`/plugins/${name}/${name}.js`)
      if (!window.plugins[name]) {
        await getScript(`/plugins/${name}.js`)
      }
      const p = window.plugins[name]
      if (p) {
        wrap(name, p)
      }
      return p
    })()
  }
  const p = await loadingScripts[name]
  delete loadingScripts[name]
  if (!p) {
    console.log('Could not find plugin ', name)
  }
  callback(p)
  return p
}

plugin.do = plugin.doPlugin = async function ($item, item, done = () => {}) {
  $item.data('item', item)
  await plugin.renderFrom($('.item').index($item))
  return done()
}

plugin.emit = async function (div, item, done = () => {}) {
  const error = function (ex, script) {
    div.append(`\
<div class="error">
  ${escape(item.text || '')}
  <button>help</button><br>
</div>\
`)
    if (item.text) {
      div.find('.error').on('dblclick', () => wiki.textEditor(div, item))
    }
    div.find('button').on('click', function () {
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
`)
      }
      const dialog = div[0].querySelector('dialog')
      dialog.addEventListener('click', function (evt) {
        if (evt.target === dialog) {
          dialog.close()
        }
      })
      dialog.showModal()
      $('.close').on('click', () => dialog.close())
      $('.retry').on('click', function () {
        if (script.emit.length > 2) {
          script.emit(div, item, () => done())
        } else {
          script.emit(div, item)
          done()
        }
      })
    })
  }

  div.data('pageElement', div.parents('.page'))
  div.data('item', item)
  const script = await plugin.get(item.type)
  try {
    if (script == null) {
      throw TypeError(`Can't find plugin for '${item.type}'`)
    }
    if (script.emit.length > 2) {
      await new Promise(resolve => {
        script.emit(div, item, function () {
          if (script.bind) {
            script.bind(div, item)
          }
          resolve()
        })
      })
    } else {
      script.emit(div, item)
    }
  } catch (err) {
    console.log('plugin error', err)
    error(err, script)
  }
  done()
}

plugin.registerPlugin = (pluginName, pluginFn) => (window.plugins[pluginName] = pluginFn($))
