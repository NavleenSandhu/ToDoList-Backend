const jwt = require('jsonwebtoken')
function fetchuser(req, res, next) {
    const token = req.header('token')
    if (!token) {
        res.status(403).json({ Forbidden: "Not Logged In" })
    } else {
        const data = jwt.verify(token, process.env.SECRET)
        req.user = data.user
        next()
    }
}

module.exports = fetchuser