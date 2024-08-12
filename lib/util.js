# This module collects various functions that might belong
# better elsewhere. At one point we thought of uniformity
# of representations but that hasn't been a strong influency.

module.exports = util = {}

# for chart plug-in
util.formatTime = (time) ->
  d = new Date (if time > 10000000000 then time else time*1000)
  mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
  h = d.getHours()
  am = if h < 12 then 'AM' else 'PM'
  h = if h == 0 then 12 else if h > 12 then h - 12 else h
  mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
  "#{h}:#{mi} #{am}<br>#{d.getDate()} #{mo} #{d.getFullYear()}"

# for journal mouse-overs and possibly for date header
util.formatDate = (msSinceEpoch) ->
  d = new Date(msSinceEpoch)
  wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
  day = d.getDate();
  yr = d.getFullYear();
  h = d.getHours()
  am = if h < 12 then 'AM' else 'PM'
  h = if h == 0 then 12 else if h > 12 then h - 12 else h
  mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
  sec = (if d.getSeconds() < 10 then "0" else "") + d.getSeconds()
  "#{wk} #{mo} #{day}, #{yr}<br>#{h}:#{mi}:#{sec} #{am}"

util.formatActionTitle = (action) ->
  title = ''
  title += "#{action.site}\n" if action.site?
  title += action.type || 'separator'
  title += " #{util.formatElapsedTime(action.date)}" if action.date?
  title += "\nfrom #{action.attribution.page}" if action.attribution?.page?
  title += "\nto #{action.removedTo.page}" if action.removedTo?.page?
  return title

util.formatElapsedTime = (msSinceEpoch) ->
  msecs = (new Date().getTime() - msSinceEpoch)
  return "#{Math.floor msecs} milliseconds ago" if (secs = msecs/1000) < 2
  return "#{Math.floor secs} seconds ago" if (mins = secs/60) < 2
  return "#{Math.floor mins} minutes ago" if (hrs = mins/60) < 2
  return "#{Math.floor hrs} hours ago" if (days = hrs/24) < 2
  return "#{Math.floor days} days ago" if (weeks = days/7) < 2
  return "#{Math.floor weeks} weeks ago" if (months = days/31) < 2
  return "#{Math.floor months} months ago" if (years = days/365) < 2
  return "#{Math.floor years} years ago"

util.formatDelay = (msSinceEpoch) ->
  msecs = (msSinceEpoch - Date.now())
  return "in #{Math.floor msecs} milliseconds" if (secs = msecs/1000) < 2
  return "in #{Math.floor secs} seconds" if (mins = secs/60) < 2
  return "in #{Math.floor mins} minutes" if (hrs = mins/60) < 2
  return "in #{Math.floor hrs} hours"
