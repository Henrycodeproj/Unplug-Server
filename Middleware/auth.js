import jwt from 'jsonwebtoken'

function isAuthenticated(req, res, next){
    if (!req.headers.authorization){
        return res.send({message:"Unauthorized"})
    }
    jwt.verify(req.headers.authorization, process.env.SECRET_SESSION, (error, result) =>{
        result ? (req.isAuth = true, req.results = result) : req.isAuth = false
        next()
    })
}

export default isAuthenticated