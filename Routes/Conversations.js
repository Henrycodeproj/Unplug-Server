import express from "express"
import isAuthenticated from "../Middleware/auth.js"
import ConversationModel from "../Models/Conversations.js"
import MessageModel from "../Models/Messages.js"
import mongoose from "mongoose"

export const router = express.Router()

router.post('/create', isAuthenticated, async (req, res) => {
    const { user1, user2 } = req.body
    const check = await ConversationModel.find({
        participants:{$all:[user1, user2]}
    })

    if (check.length === 0){
        const createConversation = new ConversationModel({
            participants:[user1, user2]
        })

        await createConversation.save()
    }
    try {
        const newConversation = await ConversationModel.findOne({
            participants:{$all:[user1, user2]}
        })
        res.status(200).send(newConversation)
    } catch (err) {
        res.status(500).send({message:"Internal Server Error"})
    }
})

router.get('/:conversationId', isAuthenticated, async (req, res) => {
    try{
        const conversationId = await ConversationModel
        .find({ 
            _id:req.params.conversationId,
            participants:req.results.id
         })

        if (conversationId.length === 0) return res.status(401).send({message:"Unauthorized"})
        
    } catch(error) {
        return res.status(404).send({message:"Bad Request"})
    }
    

    try{
        const results = await MessageModel.find({ conversationId:req.params.conversationId })
        if (results) res.status(200).send(results) 
    } catch(err) {
        return res.status(404).send({message:"User is not found"})
    }

})
