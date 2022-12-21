import mongoose from "mongoose";

const NotificationSchema =  new mongoose.Schema({
    notifiedUser: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    postId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Posts"
    },
    attendId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 60,
    }
}, {timestamps:true})

const NotificationModel = mongoose.model("Notifications", NotificationSchema)

export default NotificationModel