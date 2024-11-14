// A Factory plugin provides a drop zone for desktop content
// destined to be one or another kind of item. Double click
// will turn it into a normal paragraph.

const neighborhood = require('../neighborhood.cjs');
const plugin = require('../plugin.cjs');
const resolve = require('../resolve.cjs');
const pageHandler = require('../pageHandler.cjs');
const editor = require('../editor.mjs');
const synopsis = require('../synopsis.mjs');
const drop = require('../drop.mjs');
const active = require('../active.cjs');

const escape = line => line
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\n/g, '<br>');


const emit = function($item, item) {
  $item.append('<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>');

  const showMenu = function() {
    const menu = $item.find('p').append(`\
<br>Or Choose a Plugin
<center>
<table style="text-align:left;">
<tr><td><ul id=format><td><ul id=data><td><ul id=other>\
`
    );
    for (var info of window.catalog) {
      if (info && info.category) {
        var column = info.category;
        if (!['format', 'data'].includes(column)) { column = 'other'; }
        menu.find('#'+column).append(`\
<li><a class="menu" href="#" title="${info.title}">${info.name}</a></li>\
`
        );
      }
    }
    menu.find('a.menu').on('click', function(evt){
      const pluginName = evt.target.text;
      const pluginType = pluginName.toLowerCase();
      $item.removeClass('factory').addClass(item.type=pluginType);
      $item.off();
      evt.preventDefault();
      active.set($item.parents(".page"));
      const catalogEntry = window.catalog.find(entry => pluginName === entry.name);
      if (catalogEntry.editor) {
        try {
          window.plugins[pluginType].editor($item, item);
        } catch (error) {
          console.log(`${pluginName} Plugin editor failed: ${error}. Falling back to textEditor`);
          editor.textEditor($item, item);
        }
      } else {
        editor.textEditor($item, item);
      }
    });
  };

  const showPrompt = () => $item.append(`<p>${resolve.resolveLinks(item.prompt, escape)}</b>`);

  if (item.prompt) {
    showPrompt();
  } else if (window.catalog) {
    showMenu();
  } else {
    wiki.origin.get('system/factories.json', function(error, data) {
      // console.log 'factory', data
      window.catalog = data;
      showMenu();
    });
  }
};

const bind = function($item, item) {

  const syncEditAction = function() {
    $item.empty().off();
    $item.removeClass("factory").addClass(item.type);
    const $page = $item.parents('.page:first');
    try {
      $item.data('pageElement', $page);
      $item.data('item', item);
      plugin.getPlugin(item.type, function(plugin) {
        plugin.emit($item, item);
        plugin.bind($item, item);
      });
    } catch (err) {
      $item.append(`<p class='error'>${err}</p>`);
    }
    pageHandler.put($page, {type: 'edit', id: item.id, item});
  };

  const punt = function(data) {
    item.prompt = "Unexpected Item\nWe can't make sense of the drop.\nTry something else or see [[About Factory Plugin]].";
    data.userAgent = navigator.userAgent;
    item.punt = data;
    syncEditAction();
  };

  const addReference = data => wiki.site(data.site).get(`${data.slug}.json`, function(err, remote) {
    if (!err) {
      item.type = 'reference';
      item.site = data.site;
      item.slug = data.slug;
      item.title = remote.title || data.slug;
      item.text = synopsis(remote);
      syncEditAction();
      if (item.site) { neighborhood.registerNeighbor(item.site); }
    }
  });

  const addVideo = function(video) {
    item.type = 'video';
    item.text = `${video.text}\n(double-click to edit caption)\n`;
    syncEditAction();
  };

  const addRemoteImage = function(url) {
    // give some feedback, in case this is going to take a while...
    document.documentElement.style.cursor = 'wait';

    fetch(url)
      .then(function(response) {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('Unable to fetch image'); })
      .then(function(imageBlob) {
        const imageFileName = url.split('/').pop().split('#')[0].split('?')[0];
        // not sure if converting to file gives anything!
        // imageFile = new File([imageBlob], imageFileName, { type: imageBlob.type })
        const reader = new FileReader();
        reader.readAsDataURL(imageBlob);
        reader.onload = function(loadEvent) {
          const imageDataURL = loadEvent.target.result;
          window.plugins['image'].editor({ imageDataURL, filename: imageFileName, imageSourceURL: url, imageCaption: `Remote image [${url} source]`, $item, item });
        };
    });
  };


  const addRemoteSvg = function(url) {
    document.documentElement.style.cursor = 'wait';
    fetch(url)
      .then(function(response) {
        if (response.ok) {
          return response;
        }
        throw new Error('Unable to fetch svg');})
      .then(response => response.text())
      .then(function(svgText) {
        document.documentElement.style.cursor = 'default';
        item.type = 'html';
        item.source = url;
        item.text = svgText + `<p>[${url} Source]</p>`;
        syncEditAction();
      });
  };



  const readFile = function(file) {
    if (file != null) {
      const [majorType, minorType] = file.type.split("/");
      const reader = new FileReader();
      if (majorType === "image") {
        // svg -> html plugin
        if (minorType.startsWith('svg')) {
          reader.onload = function(loadEvent) {
            const {
              result
            } = loadEvent.target;
            item.type = 'html';
            item.text = result;
            syncEditAction();
          };
          reader.readAsText(file);
        } else {
          reader.onload = function(loadEvent) {
            // console.log('upload file', file)
            const imageDataURL = loadEvent.target.result;
            window.plugins['image'].editor({ imageDataURL, filename: file.name, imageCaption: "Uploaded image" , $item, item});
          };
          reader.readAsDataURL(file);
        }
      } else if (majorType === "text") {
        reader.onload = function(loadEvent) {
          const {
            result
          } = loadEvent.target;
          if (minorType === 'csv') {
            let array;
            item.type = 'data';
            item.columns = (array = csvToArray(result))[0];
            item.data = arrayToJson(array);
            item.text = file.fileName;
          } else {
            item.type = 'paragraph';
            item.text = result;
          }
          syncEditAction();
        };
        reader.readAsText(file);
      } else {
        punt({
          name: file.name,
          type: file.type,
          size: file.size,
          fileName: file.fileName,
          lastModified: file.lastModified
        });
      }
    }
  };

  $item.on('dblclick', function(e) {

    if (!$('.editEnable').is(':visible')) { return; }

    if (e.shiftKey) {
      return editor.textEditor($item, item, {field: 'prompt'});
    } else {
      $item.removeClass('factory').addClass(item.type = 'paragraph');
      $item.off();
      return editor.textEditor($item, item);
    }
  });

  $item.on('dragenter', evt => evt.preventDefault());
  $item.on('dragover', evt => evt.preventDefault());
  $item.on("drop", drop.dispatch({
    page: addReference,
    file: readFile,
    video: addVideo,
    image: addRemoteImage,
    svg: addRemoteSvg,
    punt
  })
  );
};

// from http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
// via http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data

var csvToArray = function(strData, strDelimiter) {
  strDelimiter = (strDelimiter || ",");
  const objPattern = new RegExp(("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
  const arrData = [ [] ];
  let arrMatches = null;
  while ((arrMatches = objPattern.exec(strData))) {
    var strMatchedValue;
    var strMatchedDelimiter = arrMatches[1];
    if (strMatchedDelimiter.length && (strMatchedDelimiter !== strDelimiter)) { arrData.push([]); }
    if (arrMatches[2]) {
      strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
    } else {
      strMatchedValue = arrMatches[3];
    }
    arrData[arrData.length - 1].push(strMatchedValue);
  }
  return arrData;
};

var arrayToJson = function(array) {
  const cols = array.shift();
  const rowToObject = function(row) {
    const obj = {};
    row.forEach(function (v, idx) {
      let k = cols[idx]
      if ((v != null) && (v.match(/\S/)) && (v !== 'NULL')) { obj[k] = v; }
    })
    return obj;
  };
  const result = [];
  for (var row of array) {
    result.push(rowToObject(row));
  }
  return result;
};


module.exports = {emit, bind};
