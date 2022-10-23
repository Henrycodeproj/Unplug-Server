import express from "express"
import isAuthenticated from '../Middleware/auth.js';
import MessageModel from "../Models/Messages.js";
import mongoose from "mongoose";

export const router = express.Router()

router.get('/recent/all/:id', isAuthenticated, async (req, res) => {
    const currentUserId = req.params.id

    try {
        const results = await MessageModel.aggregate([
            {
                $match:{
                    $or:[
                        {senderId:mongoose.Types.ObjectId(currentUserId)},
                        {recipientId:mongoose.Types.ObjectId(currentUserId)}
                    ] 
                }
            },
            {
                $group:{
                _id:"$conversationId",
                date: {$max: '$createdAt'},
                recentInfo: {$last: "$$ROOT"},
                }
            },
            {
                $sort: {date: -1}
            },
            {
                $limit:5
            },
            {
                $lookup: {
                    from: "users",
                    localField: "recentInfo.recipientId",
                    foreignField: "_id",
                    as: "recieverInfo"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "recentInfo.senderId",
                    foreignField: "_id",
                    as: "senderInfo"
                }
            },
            {
                $project: {
                    'recieverInfo._id': 1,
                    'recieverInfo.username': 1,
                    'senderInfo._id': 1,
                    'senderInfo.username':1 
                    //profile picture
                }
            }
        ])
        res.send(results)
    } catch (err) {
        res.send(err)
    }
})

router.post('/send/', isAuthenticated, async (req, res) =>{
    const {chatId, message, senderId, recipientId} = req.body

    const newMessage = new MessageModel({
        conversationId:chatId,
        senderId:senderId,
        message:message,
        recipientId:recipientId
    })

    const savedMessage = await newMessage.save()

    if (savedMessage) res.status(200).send({message:"Message Sent"})
})

router.get('/conversation/:convoID', isAuthenticated, async (req, res) =>{
    const currentConvoMessages = 
    await MessageModel.find({conversationId:req.params.convoID})
    .sort({ createdAt: -1 })
    .limit(50)
    res.send(currentConvoMessages.reverse())
})
