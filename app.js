const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const app = express();

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
