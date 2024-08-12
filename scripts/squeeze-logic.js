
squeeze = (source) ->
  target = {x:500, y:300}
  oversize = Math.max 1, Math.min( source.x/target.x, source.y/target.y)
  iterations = Math.floor Math.log2 oversize
  prescale = oversize / 2 ** iterations
  console.log source, oversize, '=', prescale, '* 2 ^', iterations

tests = [210, 510, 1100, 2100, 5100, 11000]
for x in tests
  console.log ''
  for y in tests
    squeeze {x, y}