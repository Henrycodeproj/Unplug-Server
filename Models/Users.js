import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:String,
    email: {
        type:String,
        required:true,
        unique:true
    },
    selfDescription:{
        type:String,
        default:''
    },
    socialMedia: {
        type:Map,
        of:String,
        default:""
    },
    collegeAffiliation:{
        type:String,
        default:""
    },
    isVerified:Boolean,
    sessionToken:String,
    lastActiveDate: {
        type:Date,
        default:null
    }
}, {timestamps:true})

const UserModel = mongoose.model("Users", UserSchema)

export default UserModel
