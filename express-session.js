var express = require('express')
var session = require('express-session')
var FileStore = require('session-file-store')(session)

var app = express()

app.use(session({
  secret: 'keyboard cat', //중요한 옵션, 꼭 넣어야함 노출되면 안댐 별도의 파일로 저장
  resave: false, //그냥 false, 세션데이터가 바뀌기 전까지 세션저장소에 값을 저장X
  saveUninitialized: true, //그냥 true, 세션이 필요하기 전까지는 세션을 구동시키지 않는다. 
  store:new FileStore()
})) //req객체의 프로퍼티로 세션이라고하는 객체를 추가해준다.


app.get('/', function (req, res, next) {
    console.log(req.session);
    if(req.session.num === undefined){
        req.session.num=1;
    }else{
        req.session.num = req.session.num+1;
    }
  res.send(`Views : ${req.session.num}`);
})

app.listen(3000, function(){
    console.log("listening..at 3000..");
});