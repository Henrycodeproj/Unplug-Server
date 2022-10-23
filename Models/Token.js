import mongoose from "mongoose";

const VerifyToken = new mongoose.Schema({
    userId:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:"Users"
    },
    token: {
        type:String,
        unique:true
    },
    expiresAt: {
        type: Date, default: Date.now, index: { expires: 1800 }
    }
})

const verifyTokenModel = mongoose.model("AuthToken", VerifyToken)

export default verifyTokenModel
