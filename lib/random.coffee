# Create strings containing random bytes in hexidecimal notation.

# Used for long-lived ids for story items.
# Used for short-lived keys in the lineup.
# Used for cache busting in some ajax queries.

module.exports = random = {}

random.randomByte = ->
  (((1+Math.random())*0x100)|0).toString(16).substring(1)

random.randomBytes = (n) ->
  (random.randomByte() for [1..n]).join('')
