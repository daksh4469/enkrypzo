const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.json());   


const dbsURI = 'mongodb+srv://Enkrypzo:enkrypzo@encclus.m4q6d.mongodb.net/Enkrypzo?retryWrites=true&w=majority';
mongoose.connect(dbsURI,{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.listen(3000, function () {
  console.log("Server is up and Running!!!");
});
