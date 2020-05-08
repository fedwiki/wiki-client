// Using testcheck to validate the algorithm used for squeezing an image.
// usage: npm i testcheck; node script/squeeze-test.js

const { check, gen, property } = require('testcheck')

function resizeImage(startWidth, startHeight) {
  var cW = startWidth
  var cH = startHeight
  var tW = 500
  var tH = 300

  const smallEnough = function smallEnough(width, height) {
    return width <= tW || height <= tH
  }

  // determine size for first squeeze
  const f = 
    cW / cH > tW / tH
       ? cH / tH
       : cW / tW

  // final size (we need to round as target number, as target size is not 2^n)
  var fW = Math.round(cW / f)
  var fH = Math.round(cH / f)

  //console.log('target', fW, fH)
  
  var squeezes = 0
  var x
  var y
  if (fW = tW) {
    x = tW
    y = cW
  } else {
    x = tH
    y = cH
  }
  do {
    x *= 2
    squeezes += 1
  } while (x < y)

  // first squeeze will be to
  cW = fW
  cH = fH
  for (let x = 1; x < squeezes; x++) {
    cW *= 2
    cH *= 2
  }
  //console.log('*first squeeze', startWidth, startHeight, cW, cH )

  // and then squeeze until smallEnough, if not already smallEnough
  if (!smallEnough(cW, cH)) {
      do {
        cH /= 2
        cW /= 2
      } while (!smallEnough(cW, cH))
    }

  //console.log(startWidth, startHeight, cW, cH) 

  return ((cW = tW && cH >= tH) || (cH = tH && cW >= tW))
}

const result = check(property([gen.intWithin(450,4096), gen.intWithin(250,4096)], (x,y) => {
  return resizeImage(x,y)
}), {seed: 50, numTests: 1001})

console.log(result)