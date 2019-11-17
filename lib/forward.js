function pageFor(pageKey) {
  let $page = $('.page').filter((_i, page) => $(page).data('key') == pageKey)
  if ($page.length == 0) return null
  if ($page.length > 1) console.log('warning: more than one page found for', key, $page)
  return $page[0]
}

function itemElemFor(pageItem) {
  let [pageKey, item] = pageItem.split('/')
  let page = pageFor(pageKey)
  if(!page) return null
  let $item = $(page).find(`.item[data-id=${item}]`)
  if ($item.length == 0) return null
  if ($item.length > 1) console.log('warning: more than one item found for', pageItem, $item)
  return $item[0]
}

function slugItemFor(itemElem) {
  let slug = $(itemElem).parents('.page:first').attr('id').split('_')[0]
  let id = $(itemElem).attr('data-id')
  let slugItem = `${slug}/${id}`
  return slugItem
}

// map of client producers keyed by server consumers
// client producers are identified by their pageItem
// server consumers are identified by their slugItem
const cProducers = {}
const sConsumers = []
var withSocket = new Promise((resolve, reject) => {
  $.getScript('/socket.io/socket.io.js').done(() => {
    console.log('socket.io loaded successfully!')
    var socket = io()
    socket.on('reconnect', () => {
      console.log('reconnected: reregistering client side listeners', sConsumers)
      sConsumers.forEach(sConsumer => {
        // only need to inform the server since client side listeners survive a disconnect
        socket.emit('subscribe', sConsumer)
      })
    })
    window.socket = socket
    resolve(socket)
  }).fail(() => {
    console.log('unable to load socket.io')
    reject(Error('unable to load socket.io'))
  })
})

function listener({slugItem, result}) {
  let sConsumer = slugItem
  let missing = []
  cProducers[sConsumer].forEach(cProducer => {
    let [pageKey, item] = cProducer.split('/')
    let itemElem = itemElemFor(cProducer)
    if (!itemElem) {
      missing.push(cProducer)
      return
    }
    eventProcessors[cProducer]($(itemElem), cProducer, result)
  })
  missing.forEach(cProducer => {
    // The item for the producer has been moved or removed, unregister the listener.
    console.log("Removing client side listener for", cProducer)
    cProducers[sConsumer].splice(cProducers[sConsumer].indexOf(cProducer), 1)
    eventProcessors[cProducer] = null
    if (cProducers[sConsumer].length == 0) {
      delete cProducers[sConsumer]
      console.log('Removing server side listener for', sConsumer)
      sConsumers.splice(sConsumers.indexOf(sConsumer), 1)
      withSocket.then(socket => {
        // stop listening and tell the server to stop sending
        socket.off(sConsumer, listener)
        socket.emit('unsubscribe', sConsumer)
      })
    }
  })
}

function registerHandler({sConsumer, cProducer, socket}) {
  if (!cProducers[sConsumer]) cProducers[sConsumer] = []
  if (sConsumers.indexOf(sConsumer) == -1) {
    sConsumers.push(sConsumer)
    console.log(`subscribing to ${sConsumer}`, sConsumers)
    socket.on(sConsumer, listener)
    socket.emit('subscribe', sConsumer)
  }
  if (cProducers[sConsumer].indexOf(cProducer) == -1) {
    cProducers[sConsumer].push(cProducer)
    console.log('adding producer', cProducer, cProducers)
  }
}

let eventProcessors = {}
function init($item, item, processEvent) {
  let bound = withSocket.then((socket) => {
    let page = $item.parents('.page').data('key')
    let slug = $page.attr('id').split('_')[0]
    let id = item.id

    let cProducer = `${page}/${id}`
    let sConsumer = `${slug}/${id}`
    eventProcessors[cProducer] = processEvent
    return {sConsumer, cProducer, socket}
  })
  bound.then(registerHandler)
}

module.exports = {init}

