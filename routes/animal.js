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
                res.render("A_myPet", {"petArray":record, "nickname":nickname, "type":req.session.type});
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
    var pet_type = req.body.pet_type;
    var pet_age = req.body.pet_age;
    var pet_gender = req.body.pet_gender;
    var pet_weight = req.body.pet_weight;

    console.log(animal_id, pet_name, member_id);
    var sql ="insert into pet(member_id, animal_id, pet_name, pet_age, pet_gender, pet_weight, pet_type) values(?,?,?,?,?,?,?)";
    if(member_id){
        con.query(sql, [member_id, animal_id, pet_name, pet_age, pet_gender, pet_weight, pet_type], function(error){
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
    var pet_type = req.body.pet_type;
    var pet_age = req.body.pet_age;
    var pet_gender = req.body.pet_gender;
    var pet_weight = req.body.pet_weight;

    console.log(pet_name, animal_id, member_id, pet_id);
    var sql = "update pet set pet_name=?, animal_id=?, pet_type=?, pet_age=?, pet_gender=?, pet_weight=? where pet_id=?";
    // console.log(sql);
    if(member_id){
        con.query(sql, [pet_name,parseInt(animal_id), pet_type, parseInt(pet_age), pet_gender, parseInt(pet_weight), parseInt(pet_id) ], function(error){
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

router.post("/selected", function(req, res){
    var pet_id = req.body.pet_id;
    var sql = "select * from pet where pet_id=?";
    var pet_info; 
    var gender;

    con.query(sql, [pet_id], function(error, record){
        if(error){
            console.log("선택 펫 조회 에러", error);
        }else{
            if(record[0].pet_gender==1){
                gender='남';
            }else{
                gender='여';
            }
            pet_info = record[0].pet_name+"/"+gender+"/"+record[0].pet_age+"살/"+record[0].pet_type+"/"+record[0].pet_weight+"kg"
            console.log(pet_info);
            res.send({"pet_info":pet_info});
        }
    });
});
module.exports = router;