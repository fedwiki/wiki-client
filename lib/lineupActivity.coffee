# Compare journal activity for pages in the current lineup.

lineup = require './lineup'

day = 24 * hour = 60 * minute = 60 * second = 1000

activity = (journal, from, to) ->
  for action in journal
    return true if action.date? and from < action.date and action.date <= to
  false

sparks = (journal) ->
  line = ''
  to = (new Date).getTime()
  for i in [1..60]
    line += if activity(journal, to-day, to) then '|' else '.'
    line += '<td>' if (new Date(to)).getDay() == 0
    to -= day
  line

row = (page) ->
  remote = page.getRemoteSite location.host
  title = page.getTitle()
  """
    <tr><td align=right>
      <img class="remote" src="//#{remote}/favicon.png">
      #{title}
    <td>
      #{sparks page.getRawPage().journal}
  """

table = (keys) ->
  """
    <table>
    #{(row lineup.atKey key for key in keys).join "\n"}
    </table>
  """

show = ->
  table lineup.debugKeys()

module.exports = {show}