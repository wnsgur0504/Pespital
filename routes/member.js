var express = require("express");
var session = require('express-session');
var mysql = require('mysql');
var router = express.Router();
var con = mysql.createConnection({
    url: "localhost",
    user: "cjh",
    password: "1234",
    database: "petspital",
    dateStrings: 'date'
});

con.connect();

// router.get("/main", function(req, res){
//     if(req.session.displayName){
//         res.render("A_main", {"nickname":req.session.displayName});
//     }else{
//         res.render("A_main", {"nickname":""});
//     }
// });
router.get("/login", function (req, res, next) {
    // res.render("index", {title:"Express"});
    res.redirect("/html/login.html");
});

router.post("/login", function (req, res, next) {
    var uid = req.body.id;
    var upwd = req.body.pwd;
    // console.log(uid+"/"+upwd);
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
                    req.session.save(function () {
                        // res.redirect('/board/list');
                        res.redirect("/admin");
                    }
                    );
                } else {
                    req.session.displayName = member.member_nickname;
                    req.session.displayID = uid;
                    req.session.save(function () {
                        // res.redirect('/board/list');
                        res.redirect("/member");
                    });
                }
            }
        }
    })
});

router.get("/logout", function (req, res, next) {
    delete req.session.displayName;
    req.session.save(function () {
        res.redirect('/member/login');
    });
});

router.get("/list", function (req, res) {
    var sql = "select * from member  left join member_type on member.type_id = member_type.type_id";
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("멤버 목록 조회 에러", error);
        } else {
            res.render("G_member", { "memberArray": record });
            // console.log(record[0]);
        }
    });
})

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

router.get("/myEdit", function (req, res) {
    var nickname = req.session.displayName;
    var sql = "select * from member left join member_type on member.type_id=member_type.type_id where member.member_nickname='" + nickname + "'";
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("내 정보 조회 에러", error);
        } else {
            res.render("M_myEdit", { "member": record[0] });
        }
    });
});

router.post("/myEdit/edit", function (req, res) {
    var member_id = req.body.member_id;
    var password = req.body.password;
    var email_id = req.body.email_id;
    var email_address = req.body.email_address;
    var member_phone = req.body.member_phone;
    var sql = "update member set password=?, email_id =?,email_address=?, member_phone=? where member_id=?";
    con.query(sql, [password, email_id, email_address, member_phone, member_id], function (error, fields) {
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
    var sql = "insert into member(member_id, password, type_id, member_name, email_id, email_address, member_phone, member_nickname)";
    sql += " values(?, ?, ?, ?, ?, ?, ?, ?)";
    con.query(sql, [
        req.body.member_id,
        req.body.password1,
        req.body.type_name,
        req.body.member_name,
        req.body.email_id,
        req.body.email_address,
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
    var sql = "select count(member_id) as cnt from member where member_id='" + req.query.member_id + "'";
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("아이디 체크 오류", error);
        } else {
            console.log(record);
            res.send(record[0].cnt.toString());
        }
    }
    )
});

router.get("/memberRegist/nicknameCheck", function (req, res) {
    var sql = "select count(member_nickname) as cnt from member where member_nickname='" + req.query.member_nickname + "'";
    con.query(sql, function (error, record, fields) {
        if (error) {
            console.log("닉네임 체크 오류", error);
        } else {
            console.log(record);
            res.send(record[0].cnt.toString());
        }
    }
    )
});
module.exports = router;