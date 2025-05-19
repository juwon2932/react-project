const express = require('express')
const db = require('./db')
// 추가 1. 서버 종료 후 npm i cors 로 패키지 설치
const cors = require('cors')  // 추가 2. cors

const app = express()
app.use(express.json());
app.use(cors()) // 추가 3. cors

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.get("/board/list", async (req, res) => {
    // req.query
    try{
        let [list] = await db.query("SELECT * FROM BOARD");
        res.json({
            message : "result",
            list : list
        });
    }catch(err){
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

app.get("/board/view", async (req, res) => {
   let {BOARDNO} = req.query
    try{
        let [list] = await db.query("SELECT * FROM BOARD WHERE BOARDNO = " + BOARDNO);
        res.json({
            message : "result",
            info : list[0]
        });
    }catch(err){
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

app.get("/board/remove", async (req, res) => {
    let {BOARDNO} = req.query
     try{
         let result = await db.query("DELETE FROM BOARD WHERE BOARDNO = " + BOARDNO);
         res.json({
             message : "삭제되었습니다."
         });
     }catch(err){
         console.log("에러 발생!");
         res.status(500).send("Server Error");
     }
 })

app.listen(3000, ()=>{
    console.log("서버 실행 중!"); 
})