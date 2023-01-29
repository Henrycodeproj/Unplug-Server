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
    lastActiveDate: {
        type:Date,
        default:null
    },
    profilePicture:{
        type:String,
        default:""
    },
    admin:{
        type: Boolean,
        default: false
    },
    isVerified:Boolean,
    sessionToken:String,
}, {timestamps:true})

const UserModel = mongoose.model("Users", UserSchema)

export default UserModel
