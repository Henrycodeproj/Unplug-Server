import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import UserModel from './Models/Users.js';
import bcrypt from 'bcrypt';
import verifyTokenModel from './Models/Token.js';
import crypto from 'crypto';
import sendMail from './config/mail.js';
import isAuthenticated from './Middleware/auth.js';
import NotificationModel from './Models/Notifications.js';
import { router as PostsRouter } from './Routes/Posts.js';
import { router as UserRouter } from './Routes/Users.js'
import { router as MessageRouter } from './Routes/Messages.js'
import { router as ConversationRouter } from "./Routes/Conversations.js"
import { router as LoginRouter } from "./Routes/Login.js"
import { router as AdminRouter } from "./Routes/Admin.js"
import { Server } from 'socket.io';
import { createServer } from "http"; 


const app = express()

//configurations
dotenv.config();

const corsOptions ={
    origin:'*',
    credentials:true,           
    optionSuccessStatus:200,
}

const httpServer = createServer(app);
const demoDatabasePassword = process.env.demoPassword
const PORT = process.env.PORT || 3001

const io = new Server(httpServer, {
    cors:{
        origin:['https://unplugme.netlify.app/', 'http://localhost:3000'],
        methods:["GET", "POST", "PATCH", "DELETE"],
        credentials:true
    }
});

app.use(cors(corsOptions));
app.use(express.json());
app.use('/posts', PostsRouter);
app.use('/user', UserRouter);
app.use('/message', MessageRouter);
app.use('/conversation', ConversationRouter);
app.use('/login', LoginRouter);
app.use('/admin', AdminRouter);

const DB_URL = `mongodb+srv://UnplugDemo:${demoDatabasePassword}@cluster0.scacjob.mongodb.net/?retryWrites=true&w=majority`

mongoose.connect(DB_URL, {useNewUrlParser:true, useUnifiedTopology:true})
.then(()=> console.log('Sucessfully connected to database'))
.catch((error) => console.log(error.message));

app.get('/authtest', isAuthenticated, (req,res) =>{
    if (req.isAuth) res.status(200).send(true)
    else res.status(200).send(false)
})
app.get ('/', (req, res) => {
    res.send("Backend is up")
})
app.get("/verify/:token", async (req, res)=>{
    try {
        const result = await verifyTokenModel.findOne({token:req.params.token})
        if (!result) return res.status(404).redirect('http://localhost:3000/invalid/expired')

        const account = await UserModel.findById(result.userId._id) 
        if (account.isVerified) return res.status(500).send('You have already been verified.')

        account.isVerified = true
        await account.save()
        res.status(200).redirect('http://localhost:3000/valid')
    
    } catch(error) {
        res.status(500).send('Internal Server Error')
    } 
})
app.post("/tester", async (req,res) => {
    const {username, password, email} = req.body
    res.status(200).send({user:username, password:password, email:email})
})

app.post("/createUser", async (req,res) => {
    const {username, password, email} = req.body
    
    const newUser = new UserModel({
        username:username.charAt(0).toUpperCase() + username.slice(1).toLowerCase(),
        password:password,
        email:email,
        isVerified:true
    })

    const salt = bcrypt.genSaltSync(10)
    newUser.password = bcrypt.hashSync(password, salt)

    await newUser.save() 
    .then(async response =>{
        //Creates token
        let emailToken = new verifyTokenModel({
            userId:newUser._id,
            token:crypto.randomBytes(64).toString('hex')
        })

        await emailToken.save()

        res.status(201).send(response)
        //commenting this out for demo
        /*try{
            //sends the email with verification token 
            sendMail({
                to:"test@gmail.com",
                from:"test@gmail.com",
                subject:"Unplug Account Confirmation",
                text:`${emailToken.token} testing this one too`,
                html: `<a href ="http://${req.headers.host}/verify/${emailToken.token}">Click     Here to Verify.</a>`
            })
        } catch(error) {
            console.log(error)
            res.status(400).send('Email verification failed to send')
        }*/
    }).catch (error => {
        if (error.keyValue.username && error.code === 11000) res.status(400).send(`This username ${error.keyValue.username} is already taken`)

        else if (error.keyValue.email && error.code === 11000) res.status(400).send(`This email ${error.keyValue.email} has already been signed up.`);

        else console.log(error)
    })
})

let activeUsers = {}

io.on("connection", (socket) => {

    socket.on("status", (userInfo) => {
        if (!(userInfo.userId in activeUsers)){
            activeUsers[userInfo.userId] = socket.id
            socket[socket.id] = userInfo.userId
        }
        io.emit("activeUsers", activeUsers)
    })

    socket.on("logout", (data) => {
        delete activeUsers[data.userID]
        io.emit("inactiveUsers", activeUsers)
    })
    
    socket.on("notification", async (data) => {
        const { posterID, postID, currentUser, user } = data;
    
        const checkNotification = await NotificationModel.find({
          notifiedUser: posterID,
          postId: postID,
          attendId: currentUser,
        })
          .populate("attendId", [
            "username",
            "email",
            "createdAt",
            "profilePicture",
          ])
          .populate("postId", ["_id", "Description"]);
        if (posterID in activeUsers && posterID !== currentUser) {
          socket.broadcast.emit(`${posterID}-notification`, checkNotification);
        }
        socket.broadcast.emit("likedpost", { post: postID, user: user });
      });
      
      socket.on("removeUser", async (data) => {
        console.log(data);
        const { user, post } = data;
        socket.broadcast.emit("removeLike", { user: user, post: post });
      });

    //new chats socket handler
    socket.on("messages", (newChatInfo) => {
        const newMessage = {
            _id: newChatInfo.chatId,
            recieverInfo: [
                {
                    _id: newChatInfo.recipientId,
                    username: newChatInfo.recipientUsername
                }
            ],
            senderInfo: [
                {
                    _id: newChatInfo.senderId,
                    username: newChatInfo.senderUsername
                }
            ]
        }
        socket.broadcast.emit(`${newChatInfo.recipientId}`, newMessage)
    })

    //Direct Messages
    socket.on("sendUserId", data =>{
        socket.broadcast.emit(`${data.chatId}`, data)
    });

    socket.on("disconnect", () => {
        delete activeUsers[socket[socket.id]]
        io.emit("inactiveUsers", activeUsers)
    });
})


httpServer.listen(PORT, () => {
    console.log('Server is hosted on port 3001');
});
