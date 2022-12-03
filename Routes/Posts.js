import express from 'express';
import isAuthenticated from '../Middleware/auth.js';
import PostModel from '../Models/Posts.js';
import UserModel from '../Models/Users.js';
import ReportModel from '../Models/Report.js';

export const router = express.Router();

router.post('/', isAuthenticated, async (req,res) =>{
    if (!req.isAuth) return res.status(400).send({messages : "You are not authorized."})
    try {
        const {user, post} = req.body
        const newPosts = new PostModel({
            Description:post,
            posterId:user
        })

        await newPosts.save()

        const newestPost = await PostModel.findOne({posterId:user, Description:post})
        .sort({createdAt:-1})
        .populate('posterId', ['username','email', 'createdAt', 'profilePicture'])
        if (newPosts) return res.status(200).send({message:'Posted', newestPost:newestPost})
        return res.status(500).send({message:'Error your post failed.'})
    } catch (error) {
        res.status(404).send({messages:"There was an error while uploading your post."})
    } 

})

router.get('/all', isAuthenticated, async (req, res) =>{

    try {
        const posts = await PostModel.find({})
        .sort({createdAt: -1})
        .populate('posterId', ['username','email', 'createdAt'])
        .populate('attending', ['username','profilePicture'])
        return res.status(200).send(posts)
    } catch(err){
        return res.status(500).send("Internal Server error")
    }
})

router.get('/amount/:postAmount/', isAuthenticated, async (req, res) =>{
    try {
        const filter = { _id : req.results.id };
        const update = { lastActiveDate: new Date() };
        await UserModel.findOneAndUpdate(filter, update, {
            new:true
        })
    } catch (error) {
        console.log(error)
    }
    try{
        const posts = await PostModel.find({})
        .sort({createdAt: -1})
        .limit(req.params.postAmount)
        .populate('posterId', ['username','email', 'createdAt', 'profilePicture'])
        .populate('attending', ['username', 'profilePicture'])

        return res.status(200).send(posts)
    } catch(err){
        return res.status(500).send("Internal Server error")
    }
})

router.get('/getamount/:skip', isAuthenticated, async (req, res) =>{
    try{
        const posts = await PostModel.find({})
        .sort({createdAt: -1})
        .skip(req.params.skip)
        .limit(5)
        .populate('posterId', ['username','email', 'createdAt', 'profilePicture'])
        .populate('attending', ['username', 'profilePicture'])

        return res.send(posts)
    } catch(err){
        return res.status(500).send("Internal Server error")
    }
})

router.get('/:postID/attend/:currentShown', isAuthenticated, async (req, res) =>{
    try{
        const posts = await PostModel.findById(req.params.postID)
        .sort({createdAt: -1})
        .limit(req.params.currentShown)
        .populate('attending', ['username', 'profilePicture'])
        
        return res.status(200).send(posts.attending.slice(3))
    } catch(err){
        return res.status(500).send("Internal Server error")
    }
})

router.patch('/likes/:postID/:postIndex', isAuthenticated, async (req,res) =>{
    try {
    const postID = req.params.postID
    const userID = req.body.user
    const post = await PostModel.findById(postID)

    if (post.attending.includes(userID)) post.attending = post.attending.filter(
        (users)=> users.toString() !== userID.toString()
    )
    else post.attending.push(userID)

    await post.save()

    const updatedPosts = await PostModel.find({})
    .sort({createdAt: -1})
    .limit(req.params.postIndex)
    .populate('posterId', ['username','email', 'createdAt', 'profilePicture'])
    .populate('attending', ['username','profilePicture'])

    res.status(200).send(updatedPosts)
    } catch (error) {
        res.status(500).send("Internal server error")
    } 
})

router.patch('/edit/:postId', isAuthenticated, async (req, res) => {
    const postID = req.params.postId
    const updatedDescription = req.body.updatedDescription

    const filter = {_id: postID}
    const update = {Description:updatedDescription}

    const changedPosts = await PostModel.findOneAndUpdate(
    filter,
    update,
    {
        new : true
    }
    )
    .populate('posterId', ['username','email', 'createdAt', 'profilePicture'])
    .populate('attending', ['username','profilePicture'])

    res.status(200).send(changedPosts)
})

router.delete('/delete/:postId', isAuthenticated, async (req, res) =>{
    const postId = req.params.postId
    const {userId} = req.body.data
    const jwtResults = req.results.id 
    if (jwtResults !== userId) res.status(401).send({message:"You are not authorized."})
    try{
        const post = await PostModel.findById(postId)
        if (post.posterId.toString() !== userId) throw {status:200, message:"Not your post"}
        await PostModel.findByIdAndDelete({_id:postId})
        res.status(200).send(postId)
    } catch(error) {
        console.log(error)
    }
})

router.patch('/search/like/:postID', isAuthenticated, async (req, res) => {
    if (req.results.id !== req.body.userID) return res.status(401).send({message:"You are not Authorized"})

    try {
        const post = await PostModel.findById(req.params.postID)
        if (post.attending.includes(req.body.userID)) 
            post.attending = post.attending.filter(
            (users)=> users.toString() !== req.body.userID.toString()
        )
        else post.attending.push(req.body.userID)
    
        await post.save()

        const updatedPost = await PostModel.find({_id:req.params.postID})
        .populate('posterId', ['username','email', 'createdAt', 'profilePicture'])
        .populate('attending', ['username','profilePicture'])
    
        const index = req.body.currentSearch.findIndex(posts => posts._id === req.params.postID)
        req.body.currentSearch[index] = updatedPost[0]
        res.send(req.body.currentSearch)
    } catch (error) {
        console.log(error)
    }
})

router.post('/search/', isAuthenticated, async (req, res) => {
    try {
        if (req.body.word.length >= 1) {
            const response = await PostModel.find(
                {
                    Description: {
                        '$regex' : req.body.word, '$options' : 'i'
                    }
                }
            )
            .populate('posterId', ['username','email', 'createdAt', 'profilePicture'])
            .populate('attending', ['username','profilePicture'])

            res.status(200).send(response)
        } else {
            res.send([])
        }
    } catch (error) {
        console.log(error)
    }
})

router.post('/report/:postId', isAuthenticated, async (req, res) =>{  
    const {reason, postId, reportingUserID} = req.body.data
    const newReport = new ReportModel({
        reason: reason,
        reportedPostId: postId,
        reportUserId: reportingUserID
    })
    await newReport.save()
    res.status(200).send({message:"report recieved"})
})


router.get('/popular', isAuthenticated, async (req, res) => {
    try{
        const results = await PostModel.aggregate([
            {
                $addFields: {
                  attendingLength: {
                    $size: "$attending"
                  }
                }
            },
            {
                $sort: {
                    attendingLength: -1
                }
            },
            {
                $limit:3
            },
            {
                $lookup: {
                    from: "users",
                    localField: "posterId",
                    foreignField: "_id",
                    as: "original_poster"
                }
            },
        ])
        return res.status(200).send(results)
    } catch(error) {
        console.log(error)
    }
})