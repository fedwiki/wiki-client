// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks (further review after merge of PR324)
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// handle drops of wiki pages or thing that go on wiki pages
// (we'll move decoding logic out of factory)

const nurl = require('url');

const isFile = function(event) {
  let dt;
  if ((dt = event.originalEvent.dataTransfer) != null) {
    if (dt.types.includes('Files')) {
      return dt.files[0];
    }
  }
  return null;
};

const isUrl = function(event) {
  let dt;
  if ((dt = event.originalEvent.dataTransfer) != null) {
    if ((dt.types != null) && (dt.types.includes('text/uri-list') || dt.types.includes('text/x-moz-url'))) {
      const url = dt.getData('URL');
      if (url != null ? url.length : undefined) { return url; }
    }
  }
  return null;
};

const isPage = function(url) {
  let found;
  if (found = url.match(/^https?:\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/)) {
    let origin;
    const item = {};
    [, origin, , item.site, item.slug, ] = found;
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
  let file, handle, punt, url;
  const stop = function(ignored) {
    event.preventDefault();
    event.stopPropagation();
  };
  if (url = isUrl(event)) {
    let image, page, svg, video;
    if (page = isPage(url)) {
      if (handle = handlers.page) {
        return stop(handle(page));
      }
    }
    if (video = isVideo(url)) {
      if (handle = handlers.video) {
        return stop(handle(video));
      }
    }
    if (image = isImage(url)) {
      if (handle = handlers.image) {
        return stop(handle(image));
      }
    }
    if (svg = isSvg(url)) {
      if (handle = handlers.svg) {
        return stop(handle(svg));
      }
    }
    punt = {url};
  }
  if (file = isFile(event)) {
    if (handle = handlers.file) {
      return stop(handle(file));
    }
    punt = {file};
  }
  if (handle = handlers.punt) {
    if (!punt) { punt = {dt:event.dataTransfer, types:(event.dataTransfer != null ? event.dataTransfer.types : undefined)}; }
    return stop(handle(punt));
  }
});


module.exports = {dispatch};
