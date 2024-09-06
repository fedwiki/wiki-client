// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from

 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// handle drops of wiki pages or thing that go on wiki pages
// (we'll move decoding logic out of factory)

const nurl = require('url');

const isFile = function(event) {
  let dt;
  if ((dt = event.originalEvent.dataTransfer) != null) {
    if (Array.from(dt.types).includes('Files')) {
      return dt.files[0];
    }
  }
  return null;
};

const isUrl = function(event) {
  let dt;
  if ((dt = event.originalEvent.dataTransfer) != null) {
    if ((dt.types != null) && (Array.from(dt.types).includes('text/uri-list') || Array.from(dt.types).includes('text/x-moz-url'))) {
      const url = dt.getData('URL');
      if (url != null ? url.length : undefined) { return url; }
    }
  }
  return null;
};

const isPage = function(url) {
  const found = url.match(/^https?:\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/);
  if (found ) {
    let ignore, origin;
    const item = {};
    [ignore, origin, ignore, item.site, item.slug, ignore] = Array.from(found);
    if (['view','local','origin'].includes(item.site)) { item.site = origin; }
    return item;
  }
  return null;
};

const isImage = function(url) {
  const parsedURL = nurl.parse(url, true, true);
  if (parsedURL.pathname.match(/\.(jpg|jpeg|png)$/i)) {
    return url;
  }
  return null;
};

const isSvg = function(url) {
  const parsedURL = nurl.parse(url, true, true);
  if (parsedURL.pathname.match(/\.(svg)$/i)) {
    return url;
  }
  return null;
};

const isVideo = function(url) {
  let parsedURL = nurl.parse(url, true, true);
  // check if video dragged from search (Google)
  try {
    if (parsedURL.query.source === 'video') {
      parsedURL = nurl.parse(parsedURL.query.url, true, true);
    }
  } catch (error) {}


  switch (parsedURL.hostname) {
    case "www.youtube.com":
      if (parsedURL.query.list != null) {
        return {text: `YOUTUBE PLAYLIST ${parsedURL.query.list}`};
      } else {
        return {text: `YOUTUBE ${parsedURL.query.v}`};
      }
    case "youtu.be":  // should redirect to www.youtube.com, but...
      if (parsedURL.query.list != null) {
        return {text: `YOUTUBE PLAYLIST ${parsedURL.query.list}`};
      } else {
        return {text: `YOUTUBE ${parsedURL.pathname.substr(1)}`};
      }
    case "vimeo.com":
      return {text: `VIMEO ${parsedURL.pathname.substr(1)}`};
    case "archive.org":
      return {text: `ARCHIVE ${parsedURL.pathname.substr(parsedURL.pathname.lastIndexOf('/') + 1)}`};
    case "tedxtalks.ted.com":
      return {text: `TEDX ${parsedURL.pathname.substr(parsedURL.pathname.lastIndexOf('/') + 1)}`};
    case "www.ted.com":
      return {text: `TED ${parsedURL.pathname.substr(parsedURL.pathname.lastIndexOf('/') + 1)}`};
    default:
      return null;
  }
};


const dispatch = handlers => (function(event) {
  let punt;
  const stop = function(/* ignored */) {
    event.preventDefault();
    event.stopPropagation();
  };
  const url = isUrl(event);
  if (url ) {
    const page = isPage(url);
    if (page ) {
      const handle = handlers.page;
      if (handle != null) {
        return stop(handle(page));
      }
    }
    const video = isVideo(url);
    if (video ) {
      const handle = handlers.page;
      if (handle != null) {
        return stop(handle(video));
      }
    }
    const image = isImage(url);
    if (image ) {
      const handle = handlers.page;
      if (handle != null) {
        return stop(handle(image));
      }
    }
    const svg = isSvg(url);
    if (svg ) {
      const handle = handlers.page;
      if (handle != null) {
        return stop(handle(svg));
      }
    }
    punt = {url};
  }
  const file = isFile(event);
  if (file ) {
    const handle = handlers.page;
    if (handle != null) {
      return stop(handle(file));
    }
    punt = {file};
  }
  const handle = handlers.punt;
  if (handle != null) {
    if (!punt) { punt = {dt:event.dataTransfer, types:(event.dataTransfer != null ? event.dataTransfer.types : undefined)}; }
    return stop(handle(punt));
  }
});


module.exports = {dispatch};
