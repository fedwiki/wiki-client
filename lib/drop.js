// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// handle drops of wiki pages or thing that go on wiki pages
// (we'll move decoding logic out of factory)

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
  let found;
  if (found = url.match(/^https?:\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/)) {
    let ignore, origin;
    const item = {};
    [ignore, origin, ignore, item.site, item.slug, ignore] = Array.from(found);
    if (['view','local','origin'].includes(item.site)) { item.site = origin; }
    return item;
  }
  return null;
};

const isImage = function(url) {
  const parsedURL = new URL(url);
  if (parsedURL.pathname.match(/\.(jpg|jpeg|png)$/i)) {
    return url;
  }
  return null;
};

const isSvg = function(url) {
  const parsedURL = new URL(url);
  if (parsedURL.pathname.match(/\.(svg)$/i)) {
    return url;
  }
  return null;
};

const isVideo = function(url) {
  let parsedURL = new URL(url);
  // check if video dragged from search (Google)
  try {
    if (parsedURL.searchParams.get('source') === 'video') {
      parsedURL = new URL(parsedURL.searchParams.get('url'));
    }
  } catch (error) {}


  switch (parsedURL.hostname) {
    case "www.youtube.com":
      if (parsedURL.searchParams.get('list') != null) {
        return {text: `YOUTUBE PLAYLIST ${parsedURL.searchParams.get('list')}`};
      } else {
        return {text: `YOUTUBE ${parsedURL.searchParams.get('v')}`};
      }
    case "youtu.be":  // should redirect to www.youtube.com, but...
      if (parsedURL.searchParams.get('list') != null) {
        return {text: `YOUTUBE PLAYLIST ${parsedURL.searchParams.get('list')}`};
      } else {
        return {text: `YOUTUBE ${parsedURL.pathname.substring(1)}`};
      }
    case "vimeo.com":
      return {text: `VIMEO ${parsedURL.pathname.substring(1)}`};
    case "archive.org":
      return {text: `ARCHIVE ${parsedURL.pathname.substring(parsedURL.pathname.lastIndexOf('/') + 1)}`};
    case "tedxtalks.ted.com":
      return {text: `TEDX ${parsedURL.pathname.substring(parsedURL.pathname.lastIndexOf('/') + 1)}`};
    case "www.ted.com":
      return {text: `TED ${parsedURL.pathname.substring(parsedURL.pathname.lastIndexOf('/') + 1)}`};
    default:
      return null;
  }
};


const dispatch = handlers => (function(event) {
  let file, handle, punt, url;
  const stop = function(ignored) {
    event.preventDefault();
    return event.stopPropagation();
  };
  if (url = isUrl(event)) {
    let image, page, svg, video;
    if (page = isPage(url)) {
      if ((handle = handlers.page) != null) {
        return stop(handle(page));
      }
    }
    if (video = isVideo(url)) {
      if ((handle = handlers.video) != null) {
        return stop(handle(video));
      }
    }
    if (image = isImage(url)) {
      if ((handle = handlers.image) != null) {
        return stop(handle(image));
      }
    }
    if (svg = isSvg(url)) {
      if ((handle = handlers.svg) != null) {
        return stop(handle(svg));
      }
    }
    punt = {url};
  }
  if (file = isFile(event)) {
    if ((handle = handlers.file) != null) {
      return stop(handle(file));
    }
    punt = {file};
  }
  if ((handle = handlers.punt) != null) {
    if (!punt) { punt = {dt:event.dataTransfer, types:(event.dataTransfer != null ? event.dataTransfer.types : undefined)}; }
    return stop(handle(punt));
  }
});


module.exports = {dispatch};
