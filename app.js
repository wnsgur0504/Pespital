
// 모듈 가져오기
var express = require('express')
  , routes = require('./routes/index')
  , board = require('./routes/board')
  , member = require('./routes/member')
  , diagnosis = require('./routes/diagnosis')
  , animal = require('./routes/animal')
  , disease = require('./routes/disease')
  , http = require('http')
  , path = require('path')
  , session = require('express-session')
  , MySQLStore = require('express-mysql-session')(session)
  , bodyParser = require('body-parser');

var app = express();	// 어플리케이션 생성
var port = 8889;		// 어플리케이션 포트
var options = {
  host : 'localhost'
  ,port : 3306
  ,user : 'cjh'
  ,password : '1234'
  ,database : 'petspital'
};
var sessionStore = new MySQLStore(options);

app.set('views', './views'); // New!! 
app.set('view engine', 'ejs'); // New!!
app.use('/uploads/board', express.static(__dirname + '/uploads/board'));
app.use('/uploads/diagnosis', express.static(__dirname + '/uploads/diagnosis'));
app.use('/html', express.static(__dirname + '/public/html'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/scss', express.static(__dirname + '/public/scss'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/vendor', express.static(__dirname + '/public/vendor'));
app.use(express.urlencoded( {extended : false } )); 
app.use(express.json());
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
app.use('/animal', animal);
app.use('/disease', disease);
  
// 서버 실행
http.createServer(app).listen(port, function(){
  console.log("Express server listening on port " + port);
});
