util = require '../lib/util'
expect = require 'expect.js'

timezoneOffset = ->
  ((new Date(1333843344000)).getTimezoneOffset() * 60)

describe 'util', ->
  it 'should make random bytes', ->
    a = util.randomByte()
    expect(a).to.be.a 'string'
    expect(a.length).to.be 2
  it 'should make random byte strings', ->
    s = util.randomBytes(4)
    expect(s).to.be.a 'string'
    expect(s.length).to.be 8

  it 'should format unix time', ->
    s = util.formatTime(1333843344 + timezoneOffset())
    expect(s).to.be '12:02 AM<br>8 Apr 2012'
  it 'should format javascript time', ->
    s = util.formatTime(1333843344000 + timezoneOffset() * 1000)
    expect(s).to.be '12:02 AM<br>8 Apr 2012'
  it 'should format revision date', ->
    s = util.formatDate(1333843344000 + timezoneOffset() * 1000)
    expect(s).to.be 'Sun Apr 8, 2012<br>12:02:24 AM'

