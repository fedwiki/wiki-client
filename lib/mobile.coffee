###
Everything needed for fedwiki to work smoothly on mobile
Gestures using Hammer.js
###

active = require './active'

mobileEvents = () ->
  console.log "hammer time !"
  main = document.getElementsByClassName('main')[0];
  mc = new Hammer main
  # mc.on 'pan', (ev) ->
  #   	console.log ev.type

  mc.on 'swipeleft', (ev) ->
    console.log ev.type
    nextPage = $(".active").next()
    active.set(nextPage) if nextPage.length

  mc.on 'swiperight', (ev) ->
    console.log ev.type
    nextPage = $(".active").prev()
    active.set(nextPage) if nextPage.length

module.exports = { mobileEvents }
