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

router.get("/myPet", function(req, res){
    var member_id = req.session.displayID;
    var nickname = req.session.displayName;
    var sql = "select * from pet where member_id=?";
    if(member_id){
        con.query(sql, [member_id], function(error, record){
            if(error){
                console.log("내 동물 보기 에러", error);
            }else{
                res.render("A_myPet", {"petArray":record, "nickname":nickname});
            }
        });
    }else{
        res.redirect("/html/login.html");
    }

});

router.get("/detail", function(req, res){
    var pet_id = req.query.pet_id;
    var sql = "select * from pet left join member on pet.member_id = member.member_id where pet_id=?";
    var member_id=req.session.displayID;
    if(member_id){
        con.query(sql, [pet_id], function(error, record){
            if(error){
                console.log("내 동물 상세보기 에러", error);
            }else{
                console.log(record[0]);
                res.render("A_petDetail", {"pet":record[0], "id":member_id});
            }
        });
    }else{
        res.redirect("/html/login.html");
    }
});

router.post("/regist", function(req, res){
    var animal_id=req.body.animal_id;
    var pet_name = req.body.pet_name;
    var member_id = req.session.displayID;
    console.log(animal_id, pet_name, member_id);
    var sql ="insert into pet(member_id, animal_id, pet_name) values(?,?,?)";
    if(member_id){
        con.query(sql, [member_id, animal_id, pet_name], function(error){
            if(error){
                console.log("애완동물 등록 에러", error);
            }else{
                res.redirect("/animal/myPet");
            }
        });
    }else{
        res.redirect("/html/login.html");
    }
});

router.post("/edit", function(req, res){
    var pet_name = req.body.pet_name;
    var animal_id = req.body.animal_id;
    var member_id = req.session.displayID;
    var pet_id = req.body.pet_id;
    var sql = "update pet set pet_name=?, animal_id=? where pet_id=?";
    console.log(sql);
    if(member_id){
        con.query(sql, [pet_name,parseInt(animal_id), parseInt(pet_id)], function(error){
            if(error){
                console.log("애완동물 수정 에러", error);
            }else{
                res.redirect("/animal/detail?pet_id="+pet_id);
            }
        });
    }else{
        res.redirect("/html/login.html");
    }
});

router.post("/delete", function(req, res){
    var member_id = req.session.displayID;
    var pet_id = req.body.pet_id;
    var sql = "delete from pet where pet_id=?";
    console.log(sql);
    if(member_id){
        con.query(sql, [ parseInt(pet_id)], function(error){
            if(error){
                console.log("애완동물 수정 에러", error);
            }else{
                res.redirect("/animal/myPet");
            }
        });
    }else{
        res.redirect("/html/login.html");
    }
});
module.exports = router;