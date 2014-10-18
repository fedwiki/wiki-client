# Compare journal activity for pages in the current lineup.

lineup = require './lineup'

day = 24 * hour = 60 * minute = 60 * second = 1000

activity = (journal, from, to) ->
  for action in journal
    return true if action.date? and from < action.date and action.date <= to
  false

sparks = (journal) ->
  line = ''
  days = 60
  from = (new Date).getTime() - days*day
  for [1..days]
    line += if activity(journal, from, from+day) then '|' else '.'
    line += '<td>' if (new Date(from)).getDay() == 5
    from += day
  line

row = (page) ->
  remote = page.getRemoteSite location.host
  title = page.getTitle()
  """
    <tr><td align=right>
      #{sparks page.getRawPage().journal}
    <td>
      <img class="remote" src="//#{remote}/favicon.png">
      #{title}
  """

table = (keys) ->
  """
    <table>
    #{(row lineup.atKey key for key in keys).join "\n"}
    </table>
    <p style="color: #bbb">dots are days, advancing to the right, with marks showing activity</p>
  """

show = ->
  table lineup.debugKeys()

module.exports = {show}