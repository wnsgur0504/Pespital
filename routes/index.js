var express=require("express");
var router = express.Router();

router.get("/admin", function(req, res, next){
    // res.render("index", {title:"Express"});
    if(req.session.displayName){
        res.render("G_main", {"nickname":req.session.displayName});
    }else{
        res.render("G_main", {"nickname":""});
    }
});

router.get("/member", function(req, res, next){
    // res.render("index", {title:"Express"});
    if(req.session.displayName){
        res.render("A_main", {"nickname":req.session.displayName, "type":req.session.type});
    }else{
        res.render("A_main", {"nickname":"", "type":req.session.type});
    }
});

module.exports = router; 