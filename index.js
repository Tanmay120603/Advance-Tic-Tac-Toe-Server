const express=require("express")
const {createServer}=require("http")
const {Server}=require("socket.io")
require("dotenv").config()

const server=express()
const httpServer=createServer(server)
const io=new Server(httpServer,{cors:{origin:process.env.CLIENT_URL}})

const roomData={}

io.on("connection",(socket)=>{
    socket.on("join-room",(roomId)=>{
        try {
            if(!roomData[roomId])throw new Error("Room doesn't exist") 
            if(roomData[roomId].players?.length>=2)throw new Error("Room is full")
            roomData[roomId].players?.push(socket.id)
            socket.join(roomId)
            socket.emit("success-join-room","O",roomData[roomId]?.boardSize)
            socket.to(roomId).emit("opponent-joined-room")
        }
        catch(err){
            socket.emit("error-join-room",err.message)
        }   
    })
    socket.on("create-room",(roomId,boardSize)=>{
        try{
            if(roomData[roomId])throw new Error("Room id is already in use")
            roomData[roomId]={players:[socket.id],boardSize}
            socket.join(roomId)    
            socket.emit("success-create-room","X")
        }
        catch(err){
            socket.emit("error-create-room",err.message)
        }    
    })
    socket.on("player-turn",(newBoard,roomId)=>{
        try{
            if(roomData[roomId].players.length<=1)throw new Error("Wait for other player to join")
            io.sockets.in(roomId).emit("success-player-turn",newBoard)
        }
        catch(err){
            socket.emit("error-player-turn",err.message)
        }
    })
    socket.on("leave-room",(roomId)=>{
        try{
            delete roomData[roomId]
            socket.to(roomId).emit("opponent-leaved-room")
            io.socketsLeave(roomId)
        }
        catch(err){
            console.log(err.message)
        }
    })
    socket.on("reset-board",(roomId)=>{
        try{
            socket.to(roomId).emit("success-reset-board")
        }
        catch(err){
            console.log(err.message)
        }
    })
})

io.listen(process.env.PORT)

