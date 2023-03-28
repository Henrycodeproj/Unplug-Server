import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    conversationId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Conversation"
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Users"
    },
    recipientId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Users"
    },
    message:{
        type:String
    },
    read: {
        type:Boolean,
        default: false
    }
}, {timestamps:true})

const MessageModel = mongoose.model("Messages", MessageSchema)

export default MessageModel
