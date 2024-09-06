// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// We create strings of hexidecimal digits representing a
// given number of random bytes. We use short strings for
// cache busting, medium strings for keys linking dom to
// model, and, longer still strings for lifetime identity
// of story elements.

const randomByte = () => (((1+Math.random())*0x100)|0).toString(16).substring(1);

const randomBytes = n => (__range__(1, n, true).map(() => randomByte())).join('');

const itemId = () => randomBytes(8);

module.exports = {randomByte, randomBytes, itemId};
function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
