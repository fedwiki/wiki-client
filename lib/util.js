// This module collects various functions that might belong
// better elsewhere. At one point we thought of uniformity
// of representations but that hasn't been a strong influency.

let util;
module.exports = (util = {});

// for chart plug-in
util.formatTime = function(time) {
  const d = new Date((time > 10000000000 ? time : time*1000));
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  let h = d.getHours();
  const am = h < 12 ? 'AM' : 'PM';
  h = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  return `${h}:${mi} ${am}<br>${d.getDate()} ${mo} ${d.getFullYear()}`;
};

// for journal mouse-overs and possibly for date header
util.formatDate = function(msSinceEpoch) {
  const d = new Date(msSinceEpoch);
  const wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const day = d.getDate();
  const yr = d.getFullYear();
  let h = d.getHours();
  const am = h < 12 ? 'AM' : 'PM';
  h = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  const sec = (d.getSeconds() < 10 ? "0" : "") + d.getSeconds();
  return `${wk} ${mo} ${day}, ${yr}<br>${h}:${mi}:${sec} ${am}`;
};

util.formatActionTitle = function(action) {
  let title = '';
  if (action.site) { title += `${action.site}\n`; }
  title += action.type || 'separator';
  if (action.date) { title += ` ${util.formatElapsedTime(action.date)}`; }
  if (action.attribution?.page) { title += `\nfrom ${action.attribution.page}`; }
  if (action.removedTo?.page) { title += `\nto ${action.removedTo.page}`; }
  return title;
};

util.formatElapsedTime = function(msSinceEpoch) {
  let days, hrs, mins, months, secs, weeks, years;
  const msecs = (new Date().getTime() - msSinceEpoch);
  if ((secs = msecs/1000) < 2) { return `${Math.floor(msecs)} milliseconds ago`; }
  if ((mins = secs/60) < 2) { return `${Math.floor(secs)} seconds ago`; }
  if ((hrs = mins/60) < 2) { return `${Math.floor(mins)} minutes ago`; }
  if ((days = hrs/24) < 2) { return `${Math.floor(hrs)} hours ago`; }
  if ((weeks = days/7) < 2) { return `${Math.floor(days)} days ago`; }
  if ((months = days/31) < 2) { return `${Math.floor(weeks)} weeks ago`; }
  if ((years = days/365) < 2) { return `${Math.floor(months)} months ago`; }
  return `${Math.floor(years)} years ago`;
};

util.formatDelay = function(msSinceEpoch) {
  let hrs, mins, secs;
  const msecs = (msSinceEpoch - Date.now());
  if ((secs = msecs/1000) < 2) { return `in ${Math.floor(msecs)} milliseconds`; }
  if ((mins = secs/60) < 2) { return `in ${Math.floor(secs)} seconds`; }
  if ((hrs = mins/60) < 2) { return `in ${Math.floor(mins)} minutes`; }
  return `in ${Math.floor(hrs)} hours`;
};
