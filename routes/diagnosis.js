var express=require("express");
var mysql = require("mysql");
var fs = require("fs");
var router = express.Router();
var bodyParser = require('body-parser');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var fileArray=[];
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, 'uploads/')
    
    },
    filename: function (req, file, cb) {
      //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //cb(null, file.originalname + '-' + uniqueSuffix)
    
    if(file.originalname!=null){
        fileArray.push(file.originalname);
    }
    cb(null, file.originalname)
}
})
var upload = multer({ storage: storage })
var con=mysql.createConnection({
    url:"localhost",
    user:"cjh",
    password:"1234",
    database:"petspital",
    multipleStatements:true,
    dateStrings: 'date'
});
var query="";

con.connect();

router.get("/list", function(req, res){
    var rowPerPage=10; //페이지당 보여줄 글 목록:10개
    var currentPage = 1; //현재페이지, 일단 초기화 상태
    var totalRow=0;
    var totalPage=0;
    var startPage=0, endPage=0;
    var query=""; 
    // var sort="board_id";

    if(req.query.currentPage){
        currentPage=parseInt(req.query.currentPage);
    }
    var beginRow = (currentPage-1)*rowPerPage;

    if (req.query.query) {
        query = req.query.query;
        var sql = "select count(*) as cnt from  diagnosis where ispublic=1 AND (diagnosis.dia_title like '%"+query+"%' OR diagnosis.dia_text like '%"+query+"%')";
        console.log("검색어 있을때");
    } else {
        query = "";
        var sql = "select count(*) as cnt from diagnosis where ispublic=1";
        console.log("검색어 없을때");
    }
    

    con.query(sql, function(error, record){
        if(error){
            console.log("진료기록 글 개수 조회 에러", error);
        }else{
            console.log(record[0].cnt);
            totalRow = record[0].cnt;
            totalPage = Math.floor(totalRow/rowPerPage);
            if(totalRow % rowPerPage > 0){
                totalPage++;
            }

            if(totalPage<currentPage){
                page=totalPage;
            }

            startPage = Math.floor((currentPage-1)/10)*10+1;
            endPage= startPage + rowPerPage - 1;
            if(endPage>totalPage){
                endPage = totalPage;
            }
        }
    });

    if (query) {
        query = req.query.query;
        var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.regdate, pet.pet_name, member.member_nickname ";
        sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where ispublic=1 AND (diagnosis.dia_title like '%"+query+"%' ";
        sql+= "OR diagnosis.dia_text like '%"+query+"%') order by dia_id desc limit ?,?";
    } else {
        query = "";
        var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.regdate, pet.pet_name, member.member_nickname ";
        sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where ispublic=1 order by dia_id desc limit ?,?";
        console.log("검색어 없을때");
    }
    

    // var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.regdate, pet.pet_name, member.member_nickname ";
    // sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where ispublic=1 order by dia_id desc limit ?,?";
    con.query(sql,[beginRow, rowPerPage],function(error, record, fields){
        if(error){
            console.log("진료기록 글 목록 조회 에러", error);
        }else{
            // console.log(record);
            // console.log(record[0]);
            // console.log(lastPage);
            if(req.session.displayID){
                var id = req.session.displayID;
                var nickname = req.session.displayName;
                res.render("G_diagnosis",  {
                            "diagnosisArray":record,
                            // "id":id,
                            // "nickname":nickname,
                            "startPage":startPage,
                            "endPage":endPage,
                            "currentPage":currentPage,
                            "totalPage":totalPage,
                            "query": query,
                            "sort": ""
                        }); //ejs파일 렌더링
            }else{
                res.render("G_diagnosis",  {
                            "diagnosisArray":record,
                            // "id":"",
                            // "nickname":"",
                            "startPage":startPage,
                            "endPage":endPage,
                            "currentPage":currentPage,
                            "totalPage":totalPage,
                            "query": query,
                            "sort": ""
                        }); //ejs파일 렌더링
            }
        }  
    });
});

router.get('/detail', function(req, res){
    var dia_id = req.query.dia_id;
    if(req.session.displayName){
    var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.dia_text,diagnosis.regdate, pet.pet_name, member.member_nickname ";
    sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where dia_id=?";
        con.query(sql, [dia_id],function(error, record, fields){
            if(error){
                console.log("게시판 글 조회 에러", error);
            }else{
                res.render("G_diagnosisDetail", {
                "diagnosis":record[0], 
                "id":req.session.displayID
                // "isRecomed":record[2][0],
                // "imgArray":record[3]
            });
            }
        });
    }else{
        res.redirect('/member/login');
    }
    
});
module.exports = router;
