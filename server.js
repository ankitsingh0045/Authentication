const express = require('express');
const app = express();
const dotenv = require('dotenv');
const { response } = require('express');
const mongoose = require('mongoose');
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var morgan = require("morgan");
const  User = require('./models/User');


// set morgan to log info about our requests for development use.
app.use(morgan("dev"));



//1.configure dotenv
dotenv.config({path : './config/config.env'});
const hostname = process.env.HOST_NAME;
const port = process.env.PORT;



//2.connect mongoBD Database
mongoose.connect(process.env.MONGO_DB_LOCAL_URL, {
    useCreateIndex : true ,
    useFindAndModify : true ,
    useUnifiedTopology : true ,
    useNewUrlParser : true
  }).then( (response)=>{
    console.log(`Connected to MongoDB Successfully......`)
  }).catch((err)=>{
    console.error(err);
    process.exit(1); //stop the nodejs process if unable to connect to mongodb
  });

  //3.configure bodyParser
  app.use(bodyParser.urlencoded({extended:true}));

  //4.configure cookieParser
  app.use(cookieParser());

  //5.configure session
      app.use(
          session({
              key : 'user_sid',
              secret:"thisisrsndomstuff",
              resave : false,
              saveUninitialized:false,
              cookie:{
                  expires : 600000
              }
          })
      )
    
// This middleware will check if user's cookie is still saved in browser and
// user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req,res,next)=>{
 if(req.session.user && req.cookies.user){
    res.redirect('/dashboard') 
 }
 next()
});

// middleware function to check for logged-in users(callback function)

const sessionChecker = (req , res , next)=>{
 if(req.session.user && req.cookies.user){
     res.redirect('/dashboard');
 }
 else{
     next();
 }
}

// route for Home-Page
app.get("/", sessionChecker, (req, res) => {
    res.redirect("/login");
  });
//write this login route
app.route("/login")
  .get(sessionChecker, (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
  })
.post(async (req , res)=>{
     username = req.body.username,
      password = req.body.password;

    try{
        const user = await User.findOne({username:username}).exec();
        if(!user){
            res.redirect('/login')
        }
        user.comparePassword(password ,(error , match)=>{
            if(!match){
                res.redirect("/login");
            }
        });
        req.session.user = user
        res.redirect('/dashboard')
    }
    catch (error){
        console.log(error)
    }
})


// route for user logout
app.get("/logout", (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.clearCookie("user_sid");
      res.redirect("/");
    } else {
      res.redirect("/login");
    }
  });








  //write this signup route
app.route("/signup")
.get(sessionChecker, (req, res) => {
  res.sendFile(__dirname + "/public/signup.html");
})
.post((req , res)=>{
    const user  = new User({
        username : req.body.username,
        email : req.body.email,
        password : req.body.password
    })
    user.save((err , docs)=>{
        if(err){
            res.redirect('/signup')
        }
        else{
            console.log(docs)
            req.session.user = docs
            res.redirect('/dashboard')
        }
    })
})


// route for user's dashboard
app.get("/dashboard", (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.sendFile(__dirname + "/public/dashboard.html");
    } else {
      res.redirect("/login");
    }
  });


  






app.listen(port , hostname , ()=>{
    console.log(`express server start at http://${hostname}:${port}`);
})