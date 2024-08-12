// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// Dialog manages a single popup window that is used to present a
// dialog used for detail display, usually on double click.

const open = function(title, html) {
  let body = html;
  if (typeof html === 'object') {
    body = html[0].outerHTML;
  }

  const dialogWindow = window.open('/dialog/#', 'dialog', 'popup,height=600,width=800');

  if (dialogWindow.location.pathname !== '/dialog/') {
    // this will only happen when popup is first opened.
    return dialogWindow.addEventListener('load', event => dialogWindow.postMessage({ title, body }, window.origin));
  } else {
    return dialogWindow.postMessage({ title, body }, window.origin);
  }
};

module.exports = { open };