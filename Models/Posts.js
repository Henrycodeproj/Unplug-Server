import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    Description:{
        type:String,
        required:true
    },
    posterId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    attending:[{ type : mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    expiresAt: {
        type: Date,
        default: Date.now,
        index : { expires: '3d' }
    }
},{timestamps:true})

const PostModel = mongoose.model("Posts", PostSchema)

export default PostModel