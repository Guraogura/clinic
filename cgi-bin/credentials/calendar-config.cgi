#! /usr/bin/node

/*************************
  calendar-config.js
 *************************/
// ----------------------
// ① サービスアカウントキーのプロパティ
// ----------------------
const KEY = require('./service-account-key.json').private_key;
const SERVICE_ACCT_ID = require('./service-account-key.json').client_id;
// ----------------------
// ② カレンダーURL
// ----------------------
const CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=hb2vlvkdsrnpnuhkac28o7o650%40group.calendar.google.com&ctz=Asia%2FTokyo';
// ----------------------
// ③ カレンダーID
// ----------------------
const CALENDAR_ID = {
  'myCal' : 'hb2vlvkdsrnpnuhkac28o7o650@group.calendar.google.com',
  // 必要に応じて複数列挙できる
  // 'myCal2' : '****@group.calendar.google.com',
  // 'primary': '****@gmail.com',
};
// ----------------------
// ④ タイムゾーン（日本）
// ----------------------
const TIMEZONE = 'UTC+09:00';
module.exports.calendarUrl = CALENDAR_URL;
module.exports.serviceAcctId = SERVICE_ACCT_ID;
module.exports.calendarId = CALENDAR_ID;
module.exports.key = KEY;
module.exports.timezone = TIMEZONE;