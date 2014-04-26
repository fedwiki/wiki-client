# We create strings of hexidecimal digits representing a
# given number of random bytes. We use short strings for
# cache busting, medium strings for keys linking dom to
# model, and, longer still strings for lifetime identity
# of story elements.

randomByte = ->
  (((1+Math.random())*0x100)|0).toString(16).substring(1)

randomBytes = (n) ->
  (randomByte() for [1..n]).join('')

itemId = ->
  randomBytes 8

module.exports = {randomByte, randomBytes, itemId}