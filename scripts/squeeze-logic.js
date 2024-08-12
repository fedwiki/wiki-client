// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

const squeeze = function(source) {
  const target = {x:500, y:300};
  const oversize = Math.max(1, Math.min( source.x/target.x, source.y/target.y));
  const iterations = Math.floor(Math.log2(oversize));
  const prescale = oversize / Math.pow(2, iterations);
  return console.log(source, oversize, '=', prescale, '* 2 ^', iterations);
};

const tests = [210, 510, 1100, 2100, 5100, 11000];
for (var x of Array.from(tests)) {
  console.log('');
  for (var y of Array.from(tests)) {
    squeeze({x, y});
  }
}