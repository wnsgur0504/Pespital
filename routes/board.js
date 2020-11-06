var express = require("express");
var mysql = require("mysql");
var fs = require("fs");
var router = express.Router();
var bodyParser = require('body-parser');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
const { start } = require("repl");
var fileArray = [];
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')

    },
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, file.originalname + '-' + uniqueSuffix)

        if (file.originalname != null) {
            fileArray.push(file.originalname);
        }
        cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage })
var con = mysql.createConnection({
    url: "localhost",
    user: "cjh",
    password: "1234",
    database: "petspital",
    multipleStatements: true,
    dateStrings: 'date'
});

con.connect();


router.get("/list", function (req, res, next) {

    var rowPerPage = 10; //페이지당 보여줄 글 목록:10개
    var currentPage = 1; //현재페이지, 일단 초기화 상태
    var totalRow = 0;
    var totalPage = 0;
    var startPage = 0, endPage = 0;
    var query = "";
    var sort = "board_id";

    if (req.query.sort) {
        sort = req.query.sort;
    }

    if (req.query.currentPage) {
        currentPage = parseInt(req.query.currentPage);
    }
    var beginRow = (currentPage - 1) * rowPerPage;
    if (req.query.query) {
        query = req.query.query;
        var sql = "select count(*) as cnt from board where board_title like '%" + query + "%' OR board_title like '%" + query + "%' ";
        console.log("검색어 있을때");
    } else {
        query = "";
        var sql = "select count(*) as cnt from board";
        console.log("검색어 없을때");
    }
    con.query(sql, function (error, record) {
        if (error) {
            console.log("게시판 글 개수 조회 에러", error);
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

    if (query) {
        query = req.query.query;
        sql = "select board.board_id, board.board_title, board.regdate, board.board_good, board.board_hit, member.member_nickname from board left join member on board.member_id=member.member_id where board_title like '%" + query + "%' OR board_title like '%" + query + "%' order by " + sort + " desc limit ?,?";
        console.log("검색어 있을때");
    } else {
        query = "";
        sql = "select board.board_id, board.board_title, board.regdate, board.board_good, board.board_hit, member.member_nickname from board left join member on board.member_id=member.member_id order by " + sort + " desc limit ?,?";
        console.log("검색어 없을때");
    }

    con.query(sql, [beginRow, rowPerPage], function (error, record, fields) {
        if (error) {
            console.log("게시판 글 목록 조회 에러", error);
        } else {
            // console.log(record);
            // console.log(record[0]);
            // console.log(lastPage);
            if (req.session.displayID) {
                var id = req.session.displayID;
                var nickname = req.session.displayName;

                res.render("G_board", {
                    "boardArray": record,
                    "id": id,
                    "nickname": nickname,
                    "startPage": startPage,
                    "endPage": endPage,
                    "currentPage": currentPage,
                    "totalPage": totalPage,
                    "query": query,
                    "sort": sort
                }); //ejs파일 렌더링
            } else {
                console.log(endPage, "/", totalPage);
                res.render("G_board", {
                    "boardArray": record,
                    "id": "",
                    "nickname": "",
                    "startPage": startPage,
                    "endPage": endPage,
                    "currentPage": currentPage,
                    "totalPage": totalPage,
                    "query": query,
                    "sort": sort
                }); //ejs파일 렌더링
            }
        }
    });
});
router.get("/beforeRegist", function (req, res) {
    if (req.session.displayName) {
        res.redirect("/html/G_boardRegist.html");
    } else {
        res.redirect("/member/login");
    }
});
// app.post('/upload', upload.array("many"), function(req, res){
//     // res.writeHead(300, {"Content-Type":"text/html; charset=utf8"});
//     console.log(req.body.test);
//     for(var i=0;i<fileArray.length;i++){
//         console.log(fileArray[i]);
//     }
//     res.render("test",  {
//         "imageArray": fileArray
//     }); //ejs파일 렌더링
//     fileArray=[];
//     // res.send("good");
// });
router.post("/regist", upload.array("images"), function (req, res, next) {
    //사진처리 추가 필요
    console.log(fileArray[0]);
    if (req.session.displayName) {
        var board_title = req.body.board_title;
        var board_text = req.body.board_text;
        var sql = "insert into board(member_id, board_did, board_title, board_text) values ('" + req.session.displayID + "', 1, ?, ?);";
        for (var i = 0; i < fileArray.length; i++) {
            sql += "insert into board_img(board_id, img) values (LAST_INSERT_ID(), '" + fileArray[i] + "');";
        }
        // console.log(board_title, board_text);
        con.query(sql, [board_title, board_text], function (error, fields) {
            console.log(sql);
            if (error) {
                console.log("게시판 글 삽입 에러", error);
            } else {
                res.redirect("/board/list");
            }
        });
        fileArray = [];
    } else {
        res.redirect('/member/login');
    }
});

router.get("/detail", function (req, res, next) {
    if (req.session.displayName) {
        var board_id = req.query.board_id;
        var member_id = req.query.member_id;
        var sql = "select * from board left join member on board.member_id=member.member_id where board_id=" + board_id + ";";
        sql += "update board set board_hit = board_hit+1 where board_id=" + board_id + ";";
        sql += "select count(member_id) as cnt from board_recom where board_id=" + board_id + " and member_id='" + member_id + "';";
        sql += "select * from board_img where board_id=" + board_id + ";";
        con.query(sql, function (error, record, fields) {

            if (error) {
                console.log("게시판 글 조회 에러", error);
            } else {
                res.render("G_boardDetail", {
                    "board": record[0][0],
                    "id": req.session.displayID,
                    "isRecomed": record[2][0],
                    "imgArray": record[3]
                });
            }
        });
    } else {
        res.redirect('/member/login');
    }

});

router.post("/edit", function (req, res, next) {
    var board_id = req.body.board_id;
    var board_title = req.body.board_title;
    var board_text = req.body.board_text;
    var sql = "update board set board_title=?, board_text=? where board_id=?";
    // console.log(sql);
    con.query(sql, [board_title, board_text, board_id], function (error, fields) {
        if (error) {
            console.log("게시판 글 수정 에러", error);
        }
        res.redirect("/board/detail?board_id=" + board_id);
    });
});

router.post("/delete", function (req, res, next) {
    // var board_id = multi.getparameter.board_id;
    var board_id = req.body.board_id;
    var sql = "delete from board_img where board_id=" + board_id + "; delete from board where board_id=" + board_id;
    console.log(req.body);
    con.query(sql, function (error, fields) {
        if (error) {
            console.log("게시판 글 삭제 에러", error);
        } else {
            res.redirect("/board/list");
        }
    });
});

router.get("/good", function (req, res) {
    var board_id = req.query.board_id;
    var member_id = req.query.member_id;
    console.log(board_id, member_id);
    var sql = "update board set board_good = board_good +1 where board_id=?;";
    sql += "insert into board_recom(board_id, member_id) values(?,?);"
    con.query(sql, [parseInt(board_id), parseInt(board_id), member_id], function (error, record, fields) {
        console.log(sql);
        if (error) {
            console.log("좋아요 수 에러", error);
        }
    })
});

router.get("/bad", function (req, res) {
    var board_id = req.query.board_id;
    var member_id = req.query.member_id;
    console.log(board_id, member_id);
    var sql = "update board set board_bad = board_bad +1 where board_id=?;";
    sql += "insert into board_recom(board_id, member_id) values(?,?);"
    con.query(sql, [parseInt(board_id), parseInt(board_id), member_id], function (error, record, fields) {
        console.log(sql);
        if (error) {
            console.log("좋아요 수 에러", error);
        }
    })
});


module.exports = router;