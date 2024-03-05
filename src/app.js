import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "30KB"}))
app.use(express.urlencoded({extended: true, limit: "30kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"

// routes declaration
// since humne router ko extract kiya h, to 
// routes declare karne ke liye ,we have to use it as a middleware
app.use("/api/v1/users", userRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)




export {app}