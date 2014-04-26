randomByte = ->
  (((1+Math.random())*0x100)|0).toString(16).substring(1)

randomBytes = (n) ->
  (randomByte() for [1..n]).join('')

itemId = ->
  randomBytes 8

module.exports = {randomByte, randomBytes, itemId}