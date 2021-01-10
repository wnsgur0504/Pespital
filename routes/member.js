var express = require("express");
var session = require('express-session');
var mysql = require('mysql');
var nodemailer=require('nodemailer');
var router = express.Router();
var con = mysql.createConnection({
    url: "localhost",
    user: "cjh",
    password: "1234",
    database: "petspital",
    dateStrings: 'date'
});

con.connect();


router.get("/login", function (req, res, next) {
    // res.render("index", {title:"Express"});
    res.redirect("/html/login.html");
});

router.post("/login", function (req, res, next) {
    var uid = req.body.id;
    var upwd = req.body.password;
    console.log(uid+"/"+upwd);
    var sql = "select * from member where member_id=? and password=?";
    con.query(sql, [uid, upwd], function (error, record, fields) {
        if (error) {
            console.log("멤버 조회 에러", error);
        } else {
            if (record[0] == null) {
                res.redirect("/member/login");
            } else {
                member = record[0];
                if (member.type_id == 1) {
                    req.session.displayName = member.member_nickname;
                    req.session.displayID = uid;
                    req.session.type = member.type_id;
                    req.session.save(function () {
                        // res.redirect('/board/list');
                        res.redirect("/member");
                    }
                    );
                } else {
                    req.session.displayName = member.member_nickname;
                    req.session.displayID = uid;
                    req.session.save(function () {
                        // res.redirect('/board/list');
                        // res.send({result:0});
                        res.redirect("/member");
                    });
                }
            }
        }
    })
});

router.get("/logout", function (req, res, next) {
    console.log("ff");
    delete req.session.displayName;
    delete req.session.displayID;
    delete req.session.type;
    req.session.save(function () {
        res.redirect('/member');
    });
});

router.get("/list", function (req, res) {
    var rowPerPage = 10; //페이지당 보여줄 글 목록:10개
    var currentPage = 1; //현재페이지, 일단 초기화 상태
    var totalRow = 0;
    var totalPage = 0;
    var startPage = 0, endPage = 0;
    var sql = "select * from member  left join member_type on member.type_id = member_type.type_id";

    if (req.query.currentPage) {
        currentPage = parseInt(req.query.currentPage);
    }
    var beginRow = (currentPage - 1) * rowPerPage;
    var sql = "select count(*) as cnt from member";

    var nickname = req.session.displayName;
    con.query(sql, function (error, record) {
        if (error) {
            console.log("멤버 수 조회 에러", error);
        } else {
            console.log(record[0].cnt);
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
    sql = "select * from member limit ?, ?";
    con.query(sql, [beginRow, rowPerPage],function (error, record, fields) {
        if (error) {
            console.log("멤버 목록 조회 에러", error);
        } else {
            console.log(record);
            res.render("G_member", { "memberArray": record, "nickname": nickname,"startPage": startPage,
            "endPage": endPage,
            "currentPage": currentPage,
             "type":req.session.type,
            "totalPage": totalPage});
            console.log(record[0]);
        }
    });
})

router.post("/forgot_id", function(req, res){
    var name = req.body.name;
    var phone = req.body.phone;
    var email = req.body.email;
    console.log(name, phone, email);
    var sql = "select member_id from member where member_name=? and member_phone=? and email_id=?";
    con.query(sql,[name, phone, email], function(error, record){
        if(error){
            console.log("아이디 찾기 에러", error);
        }else{
            console.log(record[0]);
            if(record.length==0){
                res.send({member_id:"0"});
            }else{
                res.send({member_id:record[0].member_id});
            }
        }
    });
});


function createCode() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

router.post("/forgot_password", function(req, res){
    var id = req.body.id;
    var email = req.body.email;
    var pw = createCode();
    var sql = "select member_id from member where member_id=? and email_id=?";
    con.query(sql,[id, email], function(error, record){
        if(error){
            console.log("비밀번호 찾기 에러", error);
        }else{
            // console.log(record[0].member_id);
            if(record.length==0){
                res.send({result:"정보를 찾을 수 없습니다!"});
                return;
            }else{
                res.send({result:"이메일로 임시 비밀번호를 전송했습니다! 반드시, 비밀번호를 변경해주세요!"});
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: 'cjh960504@gmail.com',  // gmail 계정 아이디를 입력
                      pass: 'chlwnsgur2wl@'          // gmail 계정의 비밀번호를 입력
                    }
                });
                let mailOptions = {
                    from: "cjh960504@gmail.com",    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
                    to: email ,                     // 수신 메일 주소
                    subject: '쉽고 빠르게 내 반려동물을 치료하자! 펫스피탈입니다!',   // 제목
                    text: '임시비밀번호는 '+pw+'입니다'  // 내용
                };
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                    console.log(error);
                    }
                    else {
                    console.log('Email sent: ' + info.response);
                    }
                });
            }
        }
    });

    sql = "update member set password=? where member_id=?";
    con.query(sql,[pw, id], function(error){
        if(error){
            console.log("비밀번호 변경 오류!");
        }else{
            console.log("임시 비밀번호 변경 성공!");
        }
    });
});

router.get("/detail", function (req, res) {
    var member_id = req.query.member_id;
    var sql = "select * from member  left join member_type on member.type_id = member_type.type_id where member.member_id='" + member_id + "'";
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("멤버 개인 정보 조회", error);
        } else {
            res.render("G_memberDetail", { "member": record[0] });
        }
    });
});

router.post("/detail/a_edit", function(req, res){
    var member_id = req.body.member_id;
    var password = req.body.password;

    var sql = "update member set password=?  where member_id=?";
    
    con.query(sql, [password , member_id], function(error, record){
        if(error){
            console.log("관리자 권한 멤버 정보 수정 실패", error);
        }else{
            
                res.redirect("/member/list");
            
        }
    });
});

router.post("/detail/a_delete", function(req, res){
    var member_id = req.body.member_id;
    var password = req.body.password;

    var sql = "delete from member where member_id=?";
    
    con.query(sql, [member_id], function(error, record){
        if(error){
            console.log("관리자 권한 멤버 정보 삭제 실패", error);
        }else{
            
                res.redirect("/member/list");
            
        }
    });
});

router.get("/myEdit", function (req, res) {
    var nickname = req.session.displayName;
    var sql = "select * from member left join member_type on member.type_id=member_type.type_id where member.member_nickname='" + nickname + "'";
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("내 정보 조회 에러", error);
        } else {
            res.render("M_myEdit", { "member": record[0] , "type":req.session.type});
        }
    });
});

router.post("/myEdit/edit", function (req, res) {
    var member_id = req.body.member_id;
    var password = req.body.password;
    var email_id = req.body.email_id;
    var member_phone = req.body.member_phone;
    var sql = "update member set password=?, email_id =? , member_phone=? where member_id=?";
    con.query(sql, [password, email_id,  member_phone, member_id], function (error, fields) {
        console.log(sql);
        if (error) {
            console.log("내 정보수정 에러", error);
        } else {
            res.redirect("/member/myEdit");
        }
    });
});

router.get("/myPage", function (req, res) {
    res.redirect("/html/M_myPage.html");
})

router.get("/addPet", function (req, res) {
    var sql = "select * from pet where member_id='" + req.session.displayID + "'";
    console.log(sql);
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("내 애완동물 조회 에러", error);
        } else {
            console.log(record);
            var petArray = record;
            res.render("M_animal", { "petArray": petArray });
        }
    });
})

router.post("/memberRegist", function (req, res) {
    var sql = "insert into member(member_id, password, type_id, member_name, email_id,  member_phone, member_nickname)";
    sql += " values(?, ?, ?, ?, ?, ?, ?)";
    con.query(sql, [
        req.body.member_id,
        req.body.password1,
        req.body.type_id,
        req.body.member_name,
        req.body.email_id,
        req.body.member_phone,
        req.body.member_nickname
    ], function (error, fields) {
        if (error) {
            console.log("회원가입 에러", error);
        } else {
            res.redirect("/html/login.html");
        }
    });
});

router.get("/memberRegist/idCheck", function (req, res) {
    console.log(req.query.member_id);
    var sql = "select count(member_id) as cnt from member where member_id='" + req.query.member_id + "'";
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("아이디 체크 오류", error);
        } else {
            console.log(record);
            res.send({"cnt":record[0].cnt.toString()});
        }
    }
    )
});


router.get("/memberRegist/nicknameCheck", function (req, res) {
    console.log(req.query.member_nickname);
    var member_nickname = member_nickname;
    var sql = "select count(member_id) as cnt from member where member_id='" + member_nickname+ "'";
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("아이디 체크 오류", error);
        } else {
            console.log(record);
            res.send({"cnt":record[0].cnt.toString()});
        }
    }
    )
});


module.exports = router;