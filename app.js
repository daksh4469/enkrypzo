const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const md5 = require("md5");

const app = express();

app.use(express.urlencoded({ extended: true }))
app.use(express.json());   
app.use(express.static("public"));
app.use('/favicon.ico', express.static('images/favicon.ico'));

app.set("view engine", "ejs");

const dbsURI = 'mongodb+srv://Enkrypzo:enkrypzo@encclus.m4q6d.mongodb.net/Enkrypzo?retryWrites=true&w=majority';
mongoose.connect(dbsURI,{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", (req,res) => {
  const username = req.body.username;
  const password = md5(req.body.password);
  console.log(username + " " + password);
  User.findOne({username:username}, function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        if(foundUser.password === password){
          console.log("Successfully logged in");
          res.send("Successfully logged in");
        }
      }
    }
  })
});

app.post("/register", function (req, res) {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: md5(req.body.password),
  });

  if(req.body.password === req.body.confirmpassword){
    console.log(user);
    user.save(function(err){
      if(err){
        console.log(err);
      }
      else{
        res.render("login");
      }
    });
  }
  else{
    console.log("Passwords do not match");
    res.redirect("/");
  }
  
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.listen(3000, function () {
  console.log("Server is up and Running!!!");
});
