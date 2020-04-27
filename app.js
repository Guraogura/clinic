// 必要なファイルを読み込み
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');

//server定義
var server = http.createServer();

//serverのtop directory定義
var topdir = "__dirname/"

//mime type定義
var mime = {
    ".html": "text/html",
    ".css":  "text/css; charset=utf-8",
    ".js":  "application/javascript",
    ".png":  "image/png"
    //必要に応じてmime typeを追加
};

// http.createServerがrequestを受け取った場合の処理
server.on('request', function (req, res) {
    // ファイル読み込みじゃないURIはここに記載
    var ResArray = ['cgi-bin'];

    // Responseオブジェクトを作成し、その中に必要な処理を書いていき、条件によって対応させる
    var Response = {
        // ファイル読み込みURI
        "other": function (req_path) {
            try {
                //html内のファイルなら読み込み
                var fpath = topdir + 'html' + req_path.split("?")[0]
                if ( fpath === topdir + 'html/' ) {
                    fpath += "index.html"
                }

                fs.statSync(fpath);
                data = fs.readFileSync(fpath)
                // HTTPレスポンスヘッダを出力する
                res.writeHead(200, {
                    'content-type': mime[path.extname(fpath)] || "text/plain",
                    'content-length': data.length
                });

                // HTTPレスポンスボディを出力する
                res.write(data);
                res.end()
            } catch(err) {
                //ファイルが無いならNot Foundにする
                res.writeHead(404, {"content-type": "text/plain"});
                res.write("404 Not Found\n");
                res.end()
            }
        },

        //cgi実処理
        "cgi-bin": function (req_path) {
            //コマンド、query設定
            var command = req_path.split("/")[2].split("?")[0]
            var query_string = req_path.split("/")[2].split("?")[1]
            const execSync = require('child_process').execSync;
            //これはpython3.6で実行するcommand限定。queryは環境変数QUERY_STRINGに設定
            var result =  execSync("cd " + topdir + "cgi-bin; QUERY_STRING=\""+ query_string + "\" python3.6 " + command).toString();
            separate_head_body = result.split("\n\n")
            if ( separate_head_body.length === 1 ) {
                head={'content-Type': 'text/plain'}
                body=separate_head_body[0]
            } else {
                head = ParseHeader(separate_head_body[0])
                body=separate_head_body[1]
            }

            console.log("head:" + head.toString())
            res.writeHead(200, head)

            // HTTPレスポンスボディを出力する
            console.log("body:" + body)
            res.write(body);
            res.end()
        }
    }

    // cgiのレスポンスパース処理
    function ParseHeader(header_string) {
        // HTTPヘッダーは連想配列で表現する。
        var head_hash={}
        // 各HTTPヘッダーは改行で分割
        heads=header_string.split("\n")
        for(let i = 0; i < heads.length; i++) {
            // HTTPヘッダーをさらに:で分ける。
            part = heads[i].split(":")

            //execSyncでの実行結果で改行コードが変わるケースがあったので、Content-Lengthは指定せずchunkedにする
            if ( part[0].toLowerCase() !== "content-length" ) {
                //HTTPヘッダーをhashに追加
                head_hash[part[0].toLowerCase()] = part[1]
            }
        }

        return head_hash
    }

    // URI取得、
    function GetURI (uri) {
        uri_part = uri.split("/")
        if ( ResArray.indexOf(uri_part[1]) === -1 ) {
            return "other"
        } else {
            return uri_part[1]
        }
    }

    // server.onのメイン処理
    var uri = url.parse(req.url).pathname;
    var req_path = url.parse(req.url).path;

    // urlと対応するResponseオブジェクト内関数を実行
    Response[GetURI(uri)](req_path);
});

// 指定されたポート(3000)でコネクションの受け入れを開始する
server.listen(process.env.PORT || 3000)