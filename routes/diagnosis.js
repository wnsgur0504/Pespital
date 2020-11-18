var express=require("express");
var mysql = require("mysql");
var fs = require("fs");
var router = express.Router();
var bodyParser = require('body-parser');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
// const { compile } = require("sizzle");
var fileArray=[];
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, 'uploads/diagnosis/')
    
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
    var animal_id;

    if(req.query.currentPage){
        currentPage=parseInt(req.query.currentPage);
    }
    var beginRow = (currentPage-1)*rowPerPage;

    
    if(req.query.animal_id){
        animal_id = req.query.animal_id;
        var sql = "select count(*) as cnt from diagnosis left join pet on diagnosis.pet_id = pet.pet_id where ispublic=1 and animal_id="+animal_id;

    }else{
        var sql = "select count(*) as cnt from diagnosis where ispublic=1";
        animal_id=0;
    }

    if (req.query.query) {
        query = req.query.query;
        console.log(query);
        if(animal_id==0){
            var sql = "select count(*) as cnt from  diagnosis where ispublic=1 AND (diagnosis.dia_title like '%"+query+"%' OR diagnosis.dia_text like '%"+query+"%')";
        }else{
            var sql = "select count(*) as cnt from  diagnosis left join pet on diagnosis.pet_id=pet.pet_id where ispublic=1 AND (diagnosis.dia_title like '%"+query+"%' OR diagnosis.dia_text like '%"+query+"%') AND animal_id="+animal_id;
        }
        console.log("검색어 있을때");
    } else {
        query = "";
        console.log(query);
        if(animal_id==0){
            var sql = "select count(*) as cnt from diagnosis where ispublic=1";
        }else{
            var sql = "select count(*) as cnt from diagnosis left join pet on diagnosis.pet_id=pet.pet_id where ispublic=1 and animal_id="+animal_id;
        }
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

    if(req.query.query){
        if(animal_id==0){
            var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.regdate, pet.pet_name, pet.animal_id,member.member_nickname ";
            sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where ispublic=1 and  (diagnosis.dia_title like '%"+query+"%' OR diagnosis.dia_text like '%"+query+"%') order by diagnosis.dia_id desc limit ?,?";
        }else{
            var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.regdate, pet.pet_name, pet.animal_id,member.member_nickname ";
            sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where ispublic=1 and animal_id="+animal_id+" and  (diagnosis.dia_title like '%"+query+"%' OR diagnosis.dia_text like '%"+query+"%') order by diagnosis.dia_id desc limit ?,?";
        }
    }else{
        if(animal_id==0){
            var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.regdate, pet.pet_name, pet.animal_id,member.member_nickname ";
            sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where ispublic=1 order by diagnosis.dia_id desc limit ?,?";
        }else{
            var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.regdate, pet.pet_name, pet.animal_id,member.member_nickname ";
            sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where ispublic=1 and  animal_id="+animal_id+" order by diagnosis.dia_id desc limit ?,?";
        }
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
                console.log(record);
                res.render("G_diagnosis",  {
                            "diagnosisArray":record,
                            // "id":id,
                            "nickname":nickname,
                            "startPage":startPage,
                            "endPage":endPage,
                            "currentPage":currentPage,
                            "totalPage":totalPage,
                            "type":req.session.type,
                            "query": query,
                            "sort": "",
                            "animal_id":animal_id
                        }); //ejs파일 렌더링
            }else{
                res.render("G_diagnosis",  {
                            "diagnosisArray":record,
                            // "id":"",
                            "nickname":"",
                            "startPage":startPage,
                            "endPage":endPage,
                            "currentPage":currentPage,
                            "totalPage":totalPage,
                            "query": query,
                            "sort": "", 
                            "type":req.session.type,
                            "animal_id":animal_id
                        }); //ejs파일 렌더링
            }
        }  
    });
});

router.get('/detail',function(req, res){
    var dia_id = req.query.dia_id;
    if(req.session.displayName){
        // 이미지가져오는쿼리 필요
    var sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.dia_text,diagnosis.regdate, diagnosis.ispublic, diagnosis.dia_petinfo ,pet.pet_name, pet.animal_id, member.member_nickname ";
    sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where dia_id=?;";
    sql += "select * from diagnosis_img where dia_id=?";
        con.query(sql, [dia_id, dia_id],function(error, record, fields){
            if(error){
                console.log("게시판 글 조회 에러", error);
            }else{
                console.log(record[0][0]);
                console.log(record[1].length);
                res.render("G_diagnosisDetail", {
                "diagnosis":record[0][0], 
                "id":req.session.displayID,
                // "isRecomed":record[2][0],
                "imgArray":record[1], "type":req.session.type
                
            });
            }
        });
    }else{
        res.redirect('/member/login');
    }
    
});

router.get("/beforeRegist", function(req, res){
    if (req.session.displayName) {
        res.redirect("/html/G_diagnosisRegist.html");
    } else {
        res.redirect("/member/login");
    }
});
router.post("/regist", upload.array("images"), function(req, res){
    if(req.session.displayID){
        var dia_title=req.body.dia_title;
        var dia_text=req.body.dia_text;
        var pet_id=req.body.myPet;
        var isPublic=req.body.ispublic;
        var dia_petinfo = req.body.dia_petinfo;
        console.log(req.body);
        var sql ="insert into diagnosis(member_id, pet_id, dia_title, dia_text, ispublic, dia_petinfo) values(?, ?, ?, ?, ?, ?);";
        for (var i = 0; i < fileArray.length; i++) {
            sql += "insert into diagnosis_img(dia_id, img) values (LAST_INSERT_ID(), '" + fileArray[i] + "');";
        }
        con.query(sql, [req.session.displayID, pet_id, dia_title, dia_text, isPublic, dia_petinfo], function(error){
            if(error){
                console.log("진료기록 삽입 에러", error);
            }else{
                res.redirect("/diagnosis/list");
            }
        });
    }else{
        res.redirect("/member/login");
    }
});

router.get("/checkPet", function(req,res){
    var id = req.session.displayID;
    var sql ="select * from pet where member_id=?";
    con.query(sql, [id], function(error, record){
        if(error){
            console.log("애완동물 조회 에러", error);
        }else{
            res.send(record);
        }
    });
});

router.post("/edit", function(req, res){
    console.log(req.body);
    var dia_id=req.body.dia_id;
    var dia_title=req.body.dia_title;
    var dia_text=req.body.dia_text;
    var ispublic =req.body.ispublic;
    
    var sql = "update diagnosis set dia_title=?, dia_text=?, ispublic=? where dia_id=?";
    console.log(sql);

    con.query(sql, [dia_title, dia_text, ispublic,dia_id], function(error){
        if(error){
            console.log("진료기록 수정 에러");
            res.redirect("/diagnosis/list");
        }else{
            res.redirect("/diagnosis/detail?dia_id="+dia_id);
        }
    });
});

router.post("/delete", function(req, res){
    console.log(req.body);
    var dia_id = req.body.dia_id;
    var sql="delete from diagnosis_img where dia_id=?";
    con.query(sql, [dia_id], function(error){
        if(error){
            console.log("진료기록 이미지 삭제 에러", error);
            res.redirect("/diagnosis/detail?dia_id="+dia_id);
        }
    });
    sql =  "delete from diagnosis where dia_id=?";
    con.query(sql,[dia_id], function(error){
        if(error){
            console.log("진료기록 삭제 에러", error);
            res.redirect("/diagnosis/list");
        }else{
            res.redirect("/diagnosis/list");
        }
    });
});

router.get("/myDiagnosis", function(req, res){
    var member_id = req.session.displayID;
    var rowPerPage = 10; //페이지당 보여줄 글 목록:10개
    var currentPage = 1; //현재페이지, 일단 초기화 상태
    var totalRow = 0;
    var totalPage = 0;
    var startPage = 0, endPage = 0;

    if(member_id){
        if (req.query.currentPage) {
            currentPage = parseInt(req.query.currentPage);
        }

        var beginRow = (currentPage - 1) * rowPerPage;
        var sql = "select count(*) as cnt from diagnosis where member_id=?";

        con.query(sql, [member_id], function(error, record){
            if(error){
                console.log("내진료 글 개수 조회 에러", error);
            }else{
                totalRow = record[0].cnt;
                totalPage = Math.floor(totalRow / rowPerPage);
                if (totalRow % rowPerPage > 0) {
                    totalPage++;
                }
    
                if (totalPage < currentPage) {
                    page = totalPage;
                }
    
                startPage = Math.floor((currentPage - 1) / 10) * 10 + 1;
                endPage = startPage + rowPerPage - 1;
                if (endPage > totalPage) {
                    endPage = totalPage;
                }
            }
        });
        
        sql="select diagnosis.dia_id, diagnosis.member_id, diagnosis.pet_id, diagnosis.dia_title, diagnosis.regdate, pet.pet_name, member.member_nickname ";
        sql += "from diagnosis left join member on diagnosis.member_id=member.member_id  left join pet on diagnosis.pet_id = pet.pet_id where pet.member_id=? order by dia_id desc limit ?,?";
        con.query(sql, [member_id,beginRow, rowPerPage], function(error, record){
            if(error){
                console.log("내진료 글  조회 에러", error);
            }else{
                var id = req.session.displayID;
                var nickname = req.session.displayName;
                res.render("A_myDiagnosis",  {
                            "diagnosisArray":record,
                            "id":id,
                            "nickname":nickname,
                            "startPage":startPage,
                            "endPage":endPage,
                            "currentPage":currentPage,
                            "totalPage":totalPage, "type":req.session.type
                        }); //ejs파일 렌더링
            }
        });
    }else{
        res.redirect("/html/login.html");
    }
});
module.exports = router;