import express from "express"
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import UserModel from "../Models/Users.js";

export const router = express.Router()

router.post('/', async (req,res) =>{
    const {login_username, login_password} = req.body
    try {
        const user = await UserModel.findOne({
            username:{
                 '$regex': new RegExp(`^${login_username}$`),
                 '$options': 'i' 
            }
        })
        if (user){
            bcrypt.compare(login_password, user.password, (err, result) =>{
                if(err) return res.status(500).send({message:'Internal server problem'})
                if(!result) return res.status(400).send({message:'This password you have entered is incorrect. Please try again.'})

                const salt = bcrypt.genSaltSync(10)
                const token = bcrypt.hashSync(login_username, salt)
                const randomHash = crypto.randomBytes(64).toString('hex')
                
        
                const accessToken = jwt.sign(
                  {
                    username: user.username,
                    refreshToken: randomHash,
                    id: user.id, 
                    token: token,
                    user: {
                      id: user.id,
                      username: user.username,
                      lastActive: user.lastActiveDate,
                    }
                  },
                  process.env.SECRET_SESSION,
                  { expiresIn: "1d" }
                );
        
                res.status(200).send({
                  message: "Logging In...",
                  accessToken: accessToken,
                });
              });
        } else{
            res.status(404).send({message:"This user does not exist."})
        }
    } catch(error) {
        console.log(error)
    }
})

