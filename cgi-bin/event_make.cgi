#! node
// ヘッダー出力
// console.log("Content-type: text/plain\n\n");
console.log("Content-type: application/json\n\n");

// ----------------------
// POSTの受け取り
// ----------------------
let formData = {};

process.stdin.setEncoding('utf8');
var input_string = {};

process.stdin.on('data', (chunk) => {
    input_string = chunk;
});

process.stdin.on('end', () => {
  const lines = input_string;
  a = JSON.parse(lines);
  formData = a.data;

  require('date-utils');

  // ----------------------
  // パッケージのインスタンス生成
  // ----------------------
  var Calendar = require('node-google-calendar'),
      config   = require('./credentials/calendar-config.cgi'),
      calId    = config.calendarId.myCal;
  var cal = new Calendar(config);

  // ----------------------
  // イベントパラメータ作成
  // ----------------------
  // テスト用
  //formData = {
  //  "comment": "hey",
  //  "date": "2020-4-23",
  //  "mail": "rock_heavy@hotmail.co.jp",
  //  "name": "オグラショウタ",
  //  "time": "16:00",
  //  "type": "初診",
  //};

  // 時間計算
  var startTime = `${formData.date}T${formData.time}:00+09:00`
  var d = formData.date.replace(/-/g, '/');
  var plusTime = new Date(`${d} ${formData.time}`);
  plusTime.setHours(plusTime.getHours() + 1);
  var endTime = plusTime.toFormat('YYYY-MM-DDTHH24:MI:SS+09:00');

  // パラメータ作成
  var event = {
    'start': {'dateTime': startTime},
    'end'  : {'dateTime': endTime},
    // ------------
    // 終日イベントの場合
    // 'start': {'date': '2019-08-30'},
    // 'end'  : {'date': '2019-08-30'},
    // ------------
    'summary': `${formData.name}_${formData.type}`,
    'description': `${formData.mail}\n${formData.comment}`,
    // カレンダーで表示するイベントの色
    'colorId': 1, 
  };

  // 重複チェック用パラメータ作成
  var params = {
    timeMin: startTime,
    timeMax: endTime,
  };

  // ----------------------
  // カレンダーイベントの追加
  // ----------------------
  let response = {};
  // 予約時間にイベントが存在しているか判定
  cal.Events.list(calId, params)
  .then(calEvents => {
    if ( Object.keys(calEvents).length > 0) {
      // 先約がある場合
      response.text = '申し訳ございません。その時間は既に予約が入っています。';
      response.debug = calEvents;
      // 結果を返す
      console.log(JSON.stringify({"success":0,"data":response}, 'utf8'));

    }  else {
      // 先約が無かったら予約を登録
      cal.Events.insert(calId, event)
      .then(result => {
        response.text = '予約が完了しました。';
        response.debug = result;
        console.log(JSON.stringify({"success":1,"data":response}, 'utf8'));
      })
      .catch(err => {
        response.text = '予約に失敗しました。';
        response.debug = result;
        console.log(JSON.stringify({"success":0,"data":response}, 'utf8'));
      });
    }
  })
  .catch(err => {
    console.log(err.message);
  });

});