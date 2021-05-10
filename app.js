const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');const passport = require("passport");
const md5 = require("md5");
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const { Stream } = require("stream");
const app = express();

app.use(express.urlencoded({ extended: true }))
app.use(express.json());   
app.use(express.static("public"));
app.use(methodOverride('_method'));
app.use('/favicon.ico', express.static('images/favicon.ico'));

app.set("view engine", "ejs");

const dbsURI = 'mongodb+srv://Enkrypzo:enkrypzo@encclus.m4q6d.mongodb.net/Enkrypzo?retryWrites=true&w=majority';
mongoose.connect(dbsURI,{useNewUrlParser: true, useUnifiedTopology: true});
const conn=mongoose.createConnection(dbsURI,{useNewUrlParser: true, useUnifiedTopology: true});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);
var currUser={};
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", (req,res) => {
  const email = req.body.email;
  const password = md5(req.body.password);
  console.log(email + " " + password);
  User.findOne({email:email}, function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        if(foundUser.password === password){
          // console.log(foundUser);
          currUser=foundUser;
          res.redirect("/profile");
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
        res.redirect("login");
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

let gfs;
conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: dbsURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const uploader = currUser.username;
        const fileInfo = {
          metadata:{
            uploader:uploader,
            ofn: file.originalname
          },
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });
app.post('/upload',upload.single('file'),(req,res) => {
  res.redirect('/profile');
});


app.get('/profile', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if (!files || files.length === 0) {
      res.render('profile', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||  
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('profile', { files: files, user:currUser });
    }
  });
});


app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', 'attachment; filename="' + file.metadata.ofn + '"');

    var readstream = gfs.createReadStream({
      filename: req.params.filename,
      root: 'uploads'
    });

    readstream.on("error", function(err) { 
        res.end();
    });
    readstream.pipe(res);
    return res.json(file);
  });
});

app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/profile');
  });
});

app.listen(3000, function () {
  console.log("Server is up and Running!!!");
});
