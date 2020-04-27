#! node

/*************************
  event_get.js
 *************************/
require('date-utils');

function print(data){
        process.stdout.write(data);
}

print("Content-type: application/json\n\n");

// ----------------------
// パッケージのインスタンス生成
// ----------------------
var Calendar = require('node-google-calendar'),
    config   = require('./credentials/calendar-config.cgi'),
    calId    = config.calendarId.myCal;
var cal = new Calendar(config);

// ----------------------
// カレンダーイベントの取得
// ----------------------
// 取得する対象期間を指定
// 今月と来月の日付を設定
let today = new Date();
let fDay = new Date();
fDay.setDate(1);
fDay.setHours(0,0,0);
let eDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
fDay = fDay.toFormat('YYYY-MM-DDTHH24:MI:SS+09:00');
eDay = eDay.toFormat('YYYY-MM-DDTHH24:MI:SS+09:00');
// timeMinからtimeMaxの間のカレンダーイベントが取得される
var params = {
  timeMin: fDay,
  timeMax: eDay,
};

cal.Events.list(calId, params)
.then(calEvents => {
  
  recerveData = {};
  calEvents.forEach((event)=>{
    // 開始時間をセット
    start = new Date(event.start.dateTime);
    start.setMinutes( start.getMinutes() - 30 )
    sHours = ("0"+start.getHours()).slice(-2);
    sMinutes = ("0"+start.getMinutes()).slice(-2);
    var sHouMin = Number(`${sHours}${sMinutes}`);

    // 終了時間をセット
    end = new Date(event.end.dateTime);
    eHours = ("0"+end.getHours()).slice(-2);
    eMinutes = ("0"+end.getMinutes()).slice(-2);
    var eHouMin = Number(`${eHours}${eMinutes}`);

    // マッチング配列作成
    var times = [];
    for ( var t = 0; sHouMin < eHouMin; t++ ) {
      times[t] = `${sHours}:${sMinutes}`;
      // 30分加算
      start.setMinutes( start.getMinutes() + 30 );
      sHours = ("0"+start.getHours()).slice(-2);
      sMinutes = ("0"+start.getMinutes()).slice(-2);
      var sHouMin = Number(`${sHours}${sMinutes}`);
    }

    // 日付をセット
    date = start.toFormat('YYYY-M-D');

    // jsonデータに追加
    if ( recerveData[date] ) {
      recerveData[date].push(...times);
    } else {
      recerveData[date] = times;
    }

  })

  json = JSON.stringify({"success":1,"data":recerveData}, 'utf8');
  //print("Content-Length: " + json.length + "\n\n");

  print(json);
})
.catch(err => {
  print(err.message);
});