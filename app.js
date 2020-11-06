
/**
 * Module dependencies.
 */

// 모듈 가져오기
var express = require('express')
  , routes = require('./routes/index')
  , board = require('./routes/board')
  , member = require('./routes/member')
  , diagnosis = require('./routes/diagnosis')
  , http = require('http')
  , path = require('path')
  , session = require('express-session')
  , MySQLStore = require('express-mysql-session')(session)
  , bodyParser = require('body-parser');

var app = express();	// 어플리케이션 생성
var port = 8888;		// 어플리케이션 포트
var options = {
  host : 'localhost'
  ,port : 3306
  ,user : 'cjh'
  ,password : '1234'
  ,database : 'petspital'
};
var sessionStore = new MySQLStore(options);
// 어플리케이션 설정

//   app.set('port', port);					// 웹 서버 포트
//   app.set('views', __dirname + '/views');	// 템플릿
//   app.set('view engine', 'ejs');			// 템플릿 엔진
// //   app.use(express.favicon());				// 파비콘
// //   app.use(express.logger('dev'));			// 로그 기록
// //   app.use(express.methodOverride());		// 구식 브라우저 메소드 지원
//   app.use(app.router);						// 라우팅

// 정적 리소스 처리
//   app.use(require('stylus').middleware(__dirname + '/public'));
//   app.use(express.static(path.join(__dirname, 'public')));

// app.configure('development', function(){	// 개발 버전
//   app.use(express.errorHandler());			// 에러 메세지
// });
// app.use(express.bodyParser().json());			// 요청 본문 파싱

app.set('views', './views'); // New!! 
app.set('view engine', 'ejs'); // New!!
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/html', express.static(__dirname + '/public/html'));
app.use(express.json());
app.use(express.urlencoded( {extended : false } ));
app.use(session({
    secret:'ASDASDAS321321B1@'
    ,store:sessionStore
    ,resave:false
    ,saveUninitialized:true
    }));

// 라우팅
app.use('/', routes);
app.use('/board', board);
app.use('/member', member);
app.use('/diagnosis', diagnosis);
  
// 서버 실행
http.createServer(app).listen(port, function(){
  console.log("Express server listening on port " + port);
});
