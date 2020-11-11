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

router.get("/detail",function(req,res){
    var condition = req.query.condition;
    var animal_id = req.query.animal_id;
    var member_id = req.session.displayID;
    var diseaseArray;
    if(member_id){
        var sql = "select * from disease where disease_condition like '%"+condition+"%' and animal_id ="+animal_id+"; ";
       
        con.query(sql, function(error, record){
            if(error){
                console.log("증상에 따른 질병정보 조회 오류", error);
            }else{
                console.log(record);
                // res.render("G_diseaseDetail", {"diseaseArray":record});
                diseaseArray = record;
            }
        });
        sql ="select type_id from member where member_id='"+member_id+"'";
        con.query(sql, function(error, record2){
            if(error){
                console.log("회원타입 반환 에러", error);
            }else{
                console.log(record2);
                res.render("G_diseaseDetail", {"diseaseArray":diseaseArray, "member_type":record2[0].type_id,  "type":req.session.type});
            }
        });
    }else{
        res.redirect("/html/login.html");
    }
    
});

router.post("/edit", function(req, res){
    console.log("edit");
    var diseaseId= req.body.disease_id;
    var diseaseName = req.body.disease_name;
    var diseaseCondition = req.body.disease_condition;
    var diseasePreventing = req.body.disease_preventing;
    var animal_id = req.body.animal_id;

    var sql = "update disease set disease_name=?, disease_condition=?, disease_preventing=? where disease_id=? and animal_id=?";
    con.query(sql, [diseaseName, diseaseCondition, diseasePreventing, diseaseId, animal_id], function(error){
        if(error){
            console.log("질병 데이터 수정 에러", error);
        }else{
            res.redirect("/member");
        }
    });
});

router.post("delete", function(req, res){
    var disease_id = req.body.disease_id;
    var sql = "delete from disease where disease_id=?";

    con.query(sql, [disease_id], function(error){
        if(error){
            console.log("질병 삭제 에러", error);
        }else{
            res.redirect("/member");
        }
    });
});

module.exports = router;