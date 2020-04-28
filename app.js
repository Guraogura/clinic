const port = 3000,
http = require("http"),
httpStatus = require("http-status-codes"),
fs = require("fs"); // fs モジュールをインポート
var request = require('request');
require('date-utils');


// ----------------------
// GoogleAPIパッケージのインスタンス生成
// ----------------------
var Calendar = require('node-google-calendar'),
    config   = require('./cgi-bin/credentials/calendar-config.cgi'),
    calId    = config.calendarId.myCal;
var cal = new Calendar(config);



const sendErrorResponse = res => { // エラー処理関数を作る
    res.writeHead(httpStatus.NOT_FOUND, {
    "Content-Type": "text/html"
    });
    res.write("<h1>File Not Found!</h1>");
    res.end();
    };
http.createServer((req, res) => {
    console.log(req);
    let url = req.url; // リクエストのURL をurl 変数に保存
    // URL にファイル拡張子が含まれているかチェック
    if (url === '/') {
        res.writeHead(httpStatus.OK, {
        "Content-Type": "text/html"
        }); // レスポンスのコンテンツタイプを設定
        // readFile でファイルの内容を読む
        customReadFile(`./public/index.html`, res);
    }else if (url.indexOf(".html") !== -1) {
        res.writeHead(httpStatus.OK, {
        "Content-Type": "text/html"
        }); // レスポンスのコンテンツタイプを設定
        // readFile でファイルの内容を読む
        customReadFile(`./public/${url}`, res);
    } else if (url.indexOf(".js") !== -1) {
        res.writeHead(httpStatus.OK, {
        "Content-Type": "text/javascript"
        });
        customReadFile(`./public/js/${url}`, res);
    } else if (url.indexOf(".css") !== -1) {
        res.writeHead(httpStatus.OK, {
        "Content-Type": "text/css"
        });
        customReadFile(`./public/css/${url}`, res);
    } else if (url.indexOf(".png") !== -1) {
        res.writeHead(httpStatus.OK, {
        "Content-Type": "image/png"
        });
        customReadFile(`./public/images/${url}`, res);
    } else if (url === "/event_get.cgi" ) {
        /**************************************************
          event_get.js
         **************************************************/
        // ヘッダー
        res.writeHead(httpStatus.OK, {"Content-Type": "application/json"});

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
      
          res.write(json);
          res.end()
        })
        .catch(err => {
            res.write(err.message);
            res.end()
        });
        /**************************************************
          event_get.js 終わり
         **************************************************/

    } else if (url === "/event_make.cgi" && req.method === 'POST') {
        var data = '';
        console.log('POST');
        //POSTデータを受けとる
        req.on('data', function(chunk) {data += chunk})
        .on('end', function() {
        /**************************************************
          event_make.js 
         **************************************************/
            data = JSON.parse(data);
            var formData = data.data;
            console.log('formData', formData);
            // ヘッダー
            res.writeHead(httpStatus.OK, {"Content-Type": "application/json"});

            // 時間計算
            var startTime = `${formData.date}T${formData.time}:00+09:00`
            var d = formData.date.replace(/-/g, '/');
            var plusTime = new Date(`${d} ${formData.time}`);
            plusTime.setHours(plusTime.getHours() + 1);
            var endTime = plusTime.toFormat('YYYY-MM-DDTHH24:MI:SS+09:00');
            console.log(startTime, endTime);

            // パラメータ作成
            var event = {
              'start': {'dateTime': startTime},
              'end'  : {'dateTime': endTime},
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
                        json = JSON.stringify({"success":1,"data":response}, 'utf8');

                        res.write(json);
                        res.end()
                    })
                    .catch(err => {
                        response.text = '予約に失敗しました。';
                        response.debug = result;
                        json = JSON.stringify({"success":0,"data":response}, 'utf8');
                        res.write(json);
                        res.end()
                });
              }
            })
            .catch(err => {
                response.text = 'err.message';
                json = JSON.stringify({"success":0,"data":response}, 'utf8');
                res.write(json);
                res.end()
            });
      
        });
        /**************************************************
          event_make.js 終わり
         **************************************************/
    } else {
        sendErrorResponse(res);
    }
    })
    .listen(3000);
    console.log(`The server is listening on port number: ${port}`);
    // リクエストされた名前のファイルを探す
    const customReadFile = (file_path, res) => {
        // ファイルは存在するか？
        if (fs.existsSync(file_path)) {
            fs.readFile(file_path, (error, data) => {
        if (error) {
            console.log(error);
            sendErrorResponse(res);
            return;
        }
            res.write(data);
            res.end();
        });
        } else {
            sendErrorResponse(res);
    }
    };