const express = require("express");
const ejs = require("ejs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const passport = require("passport");
const md5 = require("md5");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const { Stream } = require("stream");
const File = require("File");
var fs = require("fs");
const encrypt = require("node-file-encrypt");
const e = require("express");
const { create } = require("domain");
const app = express();
// const Mouse = require("node-mouse/mouse");
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use("/favicon.ico", express.static("images/favicon.ico"));

app.set("view engine", "ejs");

const dbsURI =
  "mongodb+srv://Enkrypzo:enkrypzo@encclus.m4q6d.mongodb.net/Enkrypzo?retryWrites=true&w=majority";
mongoose.connect(dbsURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const conn = mongoose.createConnection(dbsURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);

var storagedisk = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./tmp");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});
var uploaddisk = multer({
  storage: storagedisk,
}).single("file");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);
let currUser = {};
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = md5(req.body.password);
  console.log(email + " " + password);
  User.findOne(
    {
      email: email,
    },
    function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          if (foundUser.password === password) {
            // console.log(foundUser);
            currUser = foundUser;
            res.redirect("/profile");
          }
        }
      }
    }
  );
});

app.post("/register", function (req, res) {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: md5(req.body.password),
  });

  if (req.body.password === req.body.confirmpassword) {
    console.log(user);
    user.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("login");
      }
    });
  } else {
    console.log("Passwords do not match");
    res.redirect("/");
  }
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/profile", (req, res) => {
  if (currUser.username == null) {
    res.redirect("/login");
  } else {
    gfs.files.find().toArray((err, files) => {
      if (!files || files.length === 0) files: false;
      else files: files;
      res.render("profile", {
        files: files,
        user: currUser,
      });
    });
  }
});

// initialization of gridfs
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
});

var coordx = 0;
var coordy = 0;

// function for file encryption
function encryptfile(path, key) {
  let f = new encrypt.FileEncrypt(path);
  f.openSourceFile();
  f.encrypt(key);
  encryptPath = f.encryptFilePath;
  fs.unlinkSync(path);
  return f;
}

// function to upload the file on gridfs
function uploadtogfs(encfile) {
  const options = {
    root: "fs",
    filename: encfile.fileName,
    metadata: {
      uploader: currUser.username,
    },
  };
  let writestream = gfs.createWriteStream(options);
  fs.createReadStream(`./tmp/${encfile.encryptFileName}`).pipe(writestream);
  fs.unlinkSync(`./tmp/${encfile.encryptFileName}`);
}

// function to create ket using the randomness of the mouse
function createkey() {
  const key = crypto.randomBytes(64).toString("hex");
  return key;
}

// the upload url
app.post("/upload", function (req, res) {
  if (currUser.username == null) {
    res.redirect("/login");
  } else
    uploaddisk(req, res, function (err, event) {
      if (err) {
        return res.send("Error uploading file.");
      }
      const filename = res.req.file.originalname;
      const path = `tmp/${filename}`;
      const key = createkey();
      const keyfn = filename + " key.txt";
      res.setHeader("Content-type", "application/octet-stream");
      res.setHeader("Content-disposition", `attachment; filename=${keyfn}`);
      res.send(key);
      const encfile = encryptfile(path, key);
      uploadtogfs(encfile);
    });
});

// function for reading file
const streamToFile = (inputStream, filePath) => {
  return new Promise((resolve, reject) => {
    const fileWriteStream = fs.createWriteStream(filePath);
    inputStream.pipe(fileWriteStream).on("finish", resolve).on("error", reject);
  });
};

// function to decrypt the file
const decryptfile = (path, inputkey) => {
  return new Promise((resolve, reject) => {
    let d = new encrypt.FileEncrypt(path);
    d.openSourceFile();
    d.decryptAsync(inputkey)
      .then(resolve)
      .catch((err) => reject(err));
  });
};

// function to download the file
app.get("/download/:filename", (req, res) => {
  if (currUser.username == null) {
    res.redirect("/login");
  } else {
    const inputkey = req.body.inputkey;
    if (inputkey != "") {
      gfs.files.findOne(
        {
          filename: req.params.filename,
        },
        (err, file) => {
          if (!file || file.length === 0) {
            return res.status(404).json({
              err: "No file exists",
            });
          }
          res.set("Content-Type", file.contentType);
          res.set(
            "Content-Disposition",
            'attachment; filename="' + file.filename + '"'
          );
          let gfsreadstream = gfs.createReadStream({
            filename: req.params.filename,
            root: "fs",
          });

          const decryptpath = "./tmp/output.crypt";
          streamToFile(gfsreadstream, decryptpath)
            .then(function () {
              decryptfile(decryptpath, inputkey)
                .then(function () {
                  fs.stat(`./tmp/${req.params.filename}`, (err, stats) => {
                    if (err) {
                      console.log(err);
                      res.end("garbage key value");
                    } else {
                      let filereadstream = fs.createReadStream(
                        `./tmp/${req.params.filename}`
                      );
                      filereadstream.pipe(res);
                      fs.unlinkSync(`./tmp/${req.params.filename}`);
                    }
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            })
            .catch(function (err) {
              console.log(err);
            });
        }
      );
    } else {
      res.end("please fill the input key and try again");
    }
  }
});

// function to delete files
app.delete("/files/:id", (req, res) => {
  if (currUser.username == null) {
    res.redirect("/login");
  } else {
    gfs.remove(
      {
        _id: req.params.id,
        root: "fs",
      },
      (err, gridStore) => {
        if (err) {
          return res.status(404).json({
            err: err,
          });
        }
        res.redirect("/profile");
      }
    );
  }
});

// app port
app.listen(3000, function () {
  console.log("Server is up and Running!!!");
});
