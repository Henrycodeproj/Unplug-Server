import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    participants:[{
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'Users'
    }],
    groupChat:{
        type:Boolean
    }
})

const ConversationModel = mongoose.model("Conversation", ConversationSchema)

export default ConversationModel