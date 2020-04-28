// インスタンス作成
const app = new Vue({
  el: '#app',
  data: {
    // フォームに入力されたデータ
    formData: {
      name: '',
      mail: '',
      date: '',
      time: '',
      type: '',
      comment: '',
    },
    // ヴァリデーションチェック
    formCheck: {
      flag: 0,
      name: '',
      mail: '',
      date: '',
      time: '',
      type: '',
    },
    // 取得した予約データ
    reserveData: '',
    // カレンダー
    weeks: ['日', '月', '火', '水', '木', '金', '土'],
    calData: {
      year: 0, 
      month: 0,
      today: 0,
      activeDay: null,
    },
    // タイムチャート
    timeChart: [],
    // モーダル用
    modal: {
      status: 'loading',
      errMsg: '',
    },

  },
  methods: {
    getMonthName(month) {
      var monthName = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
      return monthName[month - 1];
    },
    moveLastMonth() {
      // 前の月を表示
      if (this.calData.month == 1) {
        this.calData.year--;
        this.calData.month = 12;
      }
      else {
        this.calData.month--;
      }
       this.formData.date = '';
       this.formData.time = '';
       this.calData.activeDay = null;
       this.timeChart = [];
    },
    moveNextMonth() {
      // 次の月を表示
      if (this.calData.month == 12) {
          this.calData.year++;
          this.calData.month = 1;
      }
      else {
          this.calData.month++;
      }
      this.formData.date = '';
      this.formData.time = '';
      this.calData.activeDay = null;
      this.timeChart = [];
    },
    dayConv(d) {
      // 日付をインスタンス化
      day = new Date(this.calData.year, this.calData.month - 1, d);
      return day;
    },
    selectDate(d, fullTime, i) {
      // カレンダー日付がクリックされた時の動作
      if ( fullTime >= this.calData.today && i != 0 && i != 3) {
        // 選択された日付を設定
        this.formData.date = `${this.calData.year}-${this.calData.month}-${d}`;
        this.calData.activeDay = d;

        this.formData.time = '';
        // タイムチャートを生成
        // 開始時間の10時をセット
        fullTime.setHours(10, 0);
        Hours = ("0"+fullTime.getHours()).slice(-2);
        Minutes = ("0"+fullTime.getMinutes()).slice(-2);
        var houMin = Number(`${Hours}${Minutes}`);
        
        // 受付終了時間をセット
        var limit = 1800;
        if ( i == 6 ){ limit = 1600; }
        
        // タイムチャート
        this.timeChart = [];
        for ( var t = 0; houMin <= limit; t++ ){
          // タイムチャートに追加
          this.timeChart[t] = {time: `${Hours}:${Minutes}`};
          // 30分加算
          fullTime.setMinutes( fullTime.getMinutes() + 30 );
          Hours = ("0"+fullTime.getHours()).slice(-2);
          Minutes = ("0"+fullTime.getMinutes()).slice(-2);
          var houMin = Number(`${Hours}${Minutes}`);
        }
      }
    },
    reserveChk(time) {
      var selectable = true;
      if ( this.reserveData[this.formData.date] ) {
        if ( this.reserveData[this.formData.date].indexOf(time) != -1 ) {
          selectable = false;
        }
      }
      return selectable;
    },

    selectTime(t) {
      if ( this.reserveChk(t) ) {
        this.formData.time = t;
      }
    },
    sendReserve() {
      // 送信ボタンが押された時の動作
      this.modal.status = "loading";
      // 入力値ヴァリデーションチェック
      this.formCheck = { flag: 0, name: '', mail: '', date: '', time: '', type: '' };

      if ( this.formData.name === '' ) {
        this.formCheck.name = '※お名前を正しく入力してください';
        this.formCheck.flag = 1;
      } 
      if ( this.formData.mail.match(/^[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9_\-]+)+$/) == null ) {
        this.formCheck.mail = '※メールアドレスを正しく入力してください';
        this.formCheck.flag = 1;
      }
      if ( this.formData.time.match(/^\d{2}:\d{2}$/) == null ) {
        this.formCheck.time = '※時間を正しく入力してください';
        this.formCheck.flag = 1;
      }
      if ( this.formData.type.match(/初診|再診/) == null ){
        this.formCheck.type = '※診察を正しく入力してください';
        this.formCheck.flag = 1;

      }

      // エラーフラグが立っていなかったらデータを送信
      if ( this.formCheck.flag != 0 ) {
        return;
      } else {
        $('#Modal').modal('show');
        let sendData = JSON.stringify({"success":1,"data":this.formData}, 'utf8');
        // POSTでデータを送信
        $.post('event_make.cgi', sendData, 'json')
        .then((res) => {
          console.log(res);
          if ( res.success === 1 ) {
            this.modal.status = "success";
          } else {
            this.modal.status = "error";
            if ( res.data.text ) {this.modal.errMsg = res.data.text;
            } else {this.modal.errMsg = "不明なエラー";}
          }
        });
      }

    },
  },
  computed: {
    calendar() {
      // 1日の曜日
      var firstDay = new Date(this.calData.year, this.calData.month - 1, 1).getDay();
      // 晦日の日にち
      var lastDate = new Date(this.calData.year, this.calData.month, 0).getDate();
      // 日にちのカウント
      var dayIdx = 1;
      var calendar = [];
      for (var w = 0; w < 6; w++) {
        var week = [];

        // 空白行をなくすため
        if (lastDate < dayIdx) {break;}

        for (var d = 0; d < 7; d++) {
          if (w == 0 && d < firstDay) {
              week[d] = {day: ''};
          } else if (w == 6 && lastDate < dayIdx) {
              week[d] = {day: ''};
              dayIdx++;
          } else if (lastDate < dayIdx) {
              week[d] = {day: ''};
              dayIdx++;
          } else {
              week[d] = {day: dayIdx, fullDay: this.dayConv(dayIdx)};
              dayIdx++;
          }
        }
        calendar.push(week);
      }
    return calendar;
    },

  },
  created() {
      // イベントデータ取得
      $.post( 'event_get.cgi', null, 'json' )
      .then((events) => {
      this.reserveData = events.data;
      console.log( this.reserveData );
      });
      // 月情報取得
      var date = new Date();
      this.calData.year = date.getFullYear();
      this.calData.month = date.getMonth() + 1;
      this.calData.today = date;

      $('#Modal').modal('hide');
  },
})


