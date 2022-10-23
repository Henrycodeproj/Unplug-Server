import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
    reason:{
        type:String,
        required:true
    },
    reportedPostId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Posts"
    },
    reportUserId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    }
}, {timestamps:true})

const ReportModel = mongoose.model("Reports", ReportSchema)

export default ReportModel