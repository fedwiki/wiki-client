// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const {formatTime, formatDate} = require('../lib/util.mjs');
const expect = require('expect.js');

const timezoneOffset = () => (new Date(1333843344000)).getTimezoneOffset() * 60;

describe('util', function() {

  it('should format unix time', function() {
    const s = formatTime(1333843344 + timezoneOffset());
    return expect(s).to.be('12:02 AM<br>8 Apr 2012');
  });
  it('should format javascript time', function() {
    const s = formatTime(1333843344000 + (timezoneOffset() * 1000));
    return expect(s).to.be('12:02 AM<br>8 Apr 2012');
  });
  return it('should format revision date', function() {
    const s = formatDate(1333843344000 + (timezoneOffset() * 1000));
    return expect(s).to.be('Sun Apr 8, 2012<br>12:02:24 AM');
  });
});

