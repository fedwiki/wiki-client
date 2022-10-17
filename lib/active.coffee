# Wiki considers one page to be active. Use active.set to change which
# page this is. A page need not be active to be edited.

module.exports = active = {}

active.scrollContainer = undefined

findScrollContainer = ->
  scrolled = $("body, html").filter -> $(this).scrollLeft() > 0
  if scrolled.length > 0
    scrolled
  else
    $("body, html").scrollLeft(12).filter(-> $(this).scrollLeft() > 0).scrollTop(0)

scrollTo = ($page) ->
  return unless $page.position()?
  active.scrollContainer ?= findScrollContainer()
  bodyWidth = $("body").width()
  minX = active.scrollContainer.scrollLeft()
  maxX = minX + bodyWidth
  target = $page.position().left
  width = $page.outerWidth(true)
  contentWidth = $(".page").outerWidth(true) * $(".page").length

  # determine target position to scroll to...
  if target < minX
    scrollTarget = target
  else if target + width > maxX
    scrollTarget = target - (bodyWidth - width)
  else if maxX > $(".pages").outerWidth()
    scrollTarget = Math.min(target, contentWidth - bodyWidth)
  # scroll to target and set focus once animation is complete
  active.scrollContainer.animate({
    scrollLeft: scrollTarget
    }, () ->
      # only set focus if focus is not already within the page to get focus
      $page.trigger('focus') unless $.contains $page[0], document.activeElement )


active.set = ($page, noScroll) ->
  $('.incremental-search').remove()
  $page = $($page)
  $(".active").removeClass("active")
  $page.addClass("active")
  scrollTo $page unless noScroll
