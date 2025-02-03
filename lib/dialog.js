// Dialog manages a single popup window that is used to present a
// dialog used for detail display, usually on double click.

const open = (title, html) => {
  let body = html
  if (typeof html === 'object') {
    body = html[0].outerHTML
  }

  const dialogWindow = window.open('/dialog/#', 'dialog', 'popup,height=600,width=800')

  if (dialogWindow.location.pathname !== '/dialog/') {
    // this will only happen when popup is first opened.
    dialogWindow.addEventListener('load', () => dialogWindow.postMessage({ title, body }, window.origin))
  } else {
    dialogWindow.postMessage({ title, body }, window.origin)
  }
}

module.exports = { open }
