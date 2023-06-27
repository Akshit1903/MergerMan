// Imports
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fsp = require("fs/promises");
const fs = require("fs");
const PDFMerger = require("pdf-merger-js");
const session = require("express-session");
const path = require("path");
const countPages = require("page-count");
const serverless = require("serverless-http");
// for managing sessions
const MongoDBStore = require("connect-mongodb-session")(session);
// for storing files
const { MongoClient } = require("mongodb");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const mongoose = require("mongoose");
const { Console, log } = require("console");
var ObjectId = require("mongodb").ObjectID;
require("dotenv").config();
// Variables Initialized
const app = express();
mongoose.set("strictQuery", true);
// configure MongoDB Database
const store = new MongoDBStore({
  // uri: "mongodb://localhost:27017/user-session-db",
  uri: `mongodb+srv://${process.env.MONGO_USERNAME_PASSWORD}@mergermancluster.3l1agd0.mongodb.net/user-session-db`,
  collection: "sessions",
});
// const client = new MongoClient("mongodb://localhost:27017/user-files-db", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// const mongoStorageURI = "mongodb://localhost:27017/user-files-db";
const mongoStorageURI = `mongodb+srv://${process.env.MONGO_USERNAME_PASSWORD}@mergermancluster.3l1agd0.mongodb.net/user-files-db`;
mongoose.connect(mongoStorageURI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
let bucket;
const conn = mongoose.connection.on("connected", () => {
  var db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "uploads",
  });
});
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

var sess = {
  secret: process.env.SECRET_KEY,
  cookie: { maxAge: 36000000 },
  cookie: {},
  resave: false,
  saveUninitialized: true,
  store: store,
};
if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

// Express Session- config
app.use(session(sess));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));
app.set("views", path.join(__dirname, "/views"));
app.use(bodyParser.urlencoded({ extended: true }));

const merger = new PDFMerger();
//Multer- path and new names of incoming files are configured

// This code saves the files on disk
// const storageOnDisk = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "/tmp");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// This code saves the files on mongoDB server
const storageOnServer = new GridFsStorage({
  url: mongoStorageURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = Date.now() + "-" + file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "uploads",
      };
      resolve(fileInfo);
    });
  },
});
const upload = multer({ storage: storageOnServer });

// pdfFile structure
// {
//   fieldname: 'pdf-files',
//   originalname: 'Untitled document - Copy.pdf',
//   encoding: '7bit',
//   mimetype: 'application/pdf',
//   destination: '/tmp',
//   filename: '1687878783277-Untitled document - Copy.pdf',
//   path: '\\tmp\\1687878783277-Untitled document - Copy.pdf',
//   size: 16323
// }
// {
//   fieldname: 'pdf-files',
//   originalname: 'Untitled document - Copy - Copy (2).pdf',
//   encoding: '7bit',
//   mimetype: 'application/pdf',
//   id: new ObjectId("649b04138d95ecaa2ac029bb"),
//   filename: 'Untitled document - Copy - Copy (2).pdf',
//   metadata: null,
//   bucketName: 'uploads',
//   chunkSize: 261120,
//   size: 16323,
//   md5: undefined,
//   uploadDate: 2023-06-27T15:45:23.104Z,
//   contentType: 'application/pdf'
// }

// POST REQUESTS

// we wait for the files to finish downloading from the mongoDB server
// async function writeFile(downloadStream, pdfFilePath) {
//   return new Promise((resolve, reject) => {
//     downloadStream.pipe(
//       fs
//         .createWriteStream(pdfFilePath)
//         .on("finish", () => {
//           resolve(true);
//         })
//         .on("error", reject)
//     );
//   });
// }
// PDFs files are sent to the database server, then loaded onto the server
// PDF info array is stored and info about the number of pages is added asynchronously
app.post("/", upload.array("pdf-files"), (req, res) => {
  // IIFE invoked as current scope cannot be async
  (async () => {
    const pdfFiles = req.files;
    for (let i = 0; i < pdfFiles.length; i++) {
      const pdfFilePath = "\\tmp/" + pdfFiles[i].filename;
      // open a stream to the mongoDB server
      const downloadStream = await bucket.openDownloadStream(
        ObjectId(pdfFiles[i].id)
      );
      // write to our server from the open stream
      // await writeFile(downloadStream, pdfFilePath);
      await new Promise((resolve, reject) => {
        downloadStream.pipe(
          fs
            .createWriteStream(pdfFilePath)
            .on("finish", () => {
              resolve(true);
            })
            .on("error", reject)
        );
      });
      // console.log(fs.existsSync(pdfFilePath));
      pdfFiles[i].path = pdfFilePath;
      // count the pages from the temporary copy of file
      // setTimeout(async () => {
      //   const pdfBuffer = await fsp.readFile(pdfFiles[i].path);
      //   const pdfFilePages = await countPages.PdfCounter.count(pdfBuffer);
      //   pdfFiles[i].pages = pdfFilePages;
      // }, 1000);
      const pdfBuffer = await fsp.readFile(pdfFiles[i].path);
      const pdfFilePages = await countPages.PdfCounter.count(pdfBuffer);
      pdfFiles[i].pages = pdfFilePages;
    }

    if (req.body.submit === "Quick Merge") {
      (async () => {
        for (let i = 0; i < pdfFiles.length; i++) {
          if (!fs.existsSync(pdfFiles[i].path)) {
            const downloadStream = await bucket.openDownloadStream(
              ObjectId(pdfFiles[i].id)
            );
            // await writeFile(downloadStream, pdfFiles[i].path);
            await new Promise((resolve, reject) => {
              downloadStream.pipe(
                fs
                  .createWriteStream(pdfFiles[i].path)
                  .on("finish", () => {
                    resolve(true);
                  })
                  .on("error", reject)
              );
            });
          }
          await merger.add(pdfFiles[i].path);
        }
        await merger.save(`/tmp/merged.pdf`);
        for (let i = 0; i < pdfFiles.length; i++) {
          // Deleting files as no longer needed
          if (fs.existsSync(pdfFiles[i].path)) {
            await fsp.unlink(pdfFiles[i].path);
          }
        }
        // Buffer is reset as sometimes previous session files were loaded
        merger.reset();
        deleteMergedPDF();
        res.redirect("openpdf");
      })();
    } else {
      req.session.pdfFilesInfo = pdfFiles;
      res.redirect("/filters");
    }
  })();
});

// Function to clean user files after they're sent
const deleteMergedPDF = () => {
  setTimeout(async () => {
    if (fs.existsSync(`/tmp/merged.pdf`)) {
      await fsp.unlink(`/tmp/merged.pdf`);
    }
  }, 30000);
};

// PDF info array and page numbers arrays is read from the current session
// each PDF is added one by one w.r.t their page numbers
app.post("/filters", (req, res) => {
  const pdfFiles = req.session.pdfFilesInfo;
  if (!pdfFiles || pdfFiles.length === 0) {
    res.render("failure", {
      errorMessage: "Session crashed while filter POST",
    });
    return;
  }
  const startingPageNumbers = req.body.startingPageNumbers;
  const endingPageNumbers = req.body.endingPageNumbers;
  // IIFE invoked because current scope can't be async
  (async () => {
    if (pdfFiles.length === 1) {
      // A number is sent by POST request when one field is present
      const range = startingPageNumbers + "-" + endingPageNumbers;
      await merger.add(pdfFiles[0].path, range);
    } else {
      // Concatenating all files one by one
      for (let i = 0; i < pdfFiles.length; i++) {
        if (!fs.existsSync(pdfFiles[i].path)) {
          // res.render("failure", { errorMessage: "One of user files lost" });
          const pdfFilePath = "\\tmp/" + pdfFiles[i].filename;
          // open a stream to the mongoDB server
          const downloadStream = await bucket.openDownloadStream(
            ObjectId(pdfFiles[i].id)
          );
          // write to our server from the open stream
          // await writeFile(downloadStream, pdfFilePath);
          await new Promise((resolve, reject) => {
            downloadStream.pipe(
              fs
                .createWriteStream(pdfFilePath)
                .on("finish", () => {
                  resolve(true);
                })
                .on("error", reject)
            );
          });
        }
        const range = startingPageNumbers[i] + "-" + endingPageNumbers[i];
        await merger.add(pdfFiles[i].path, range);
        // delete the files locally and from database since they're used
        await bucket.delete(ObjectId(pdfFiles[i].id));
        if (fs.existsSync(pdfFiles[i].path)) {
          await fsp.unlink(pdfFiles[i].path);
        }
      }
    }
    await merger.save(`/tmp/merged.pdf`);
    // Buffer is reset as sometimes previous session files were loaded
    merger.reset();
    req.session.pdfFilesInfo = [];
    res.render("success");
    deleteMergedPDF();
  })();
});

// GET REQUESTS
// PDF files information object array is read from the current session
// The array is used to render the filter route.
app.get("/filters", (req, res) => {
  const pdfFiles = req.session.pdfFilesInfo;
  if (!pdfFiles || pdfFiles.length === 0) {
    res.render("failure", { errorMessage: "Session crashed while filter GET" });
  } else {
    res.render("filters", { pdfFiles: pdfFiles });
  }
});

// Download process is started
app.get("/downloadpdf", (req, res) => {
  if (fs.existsSync(`/tmp/merged.pdf`)) {
    res.download(`/tmp/merged.pdf`);
  } else {
    res.render("failure", { errorMessage: "Merged file lost" });
  }
});

// Opens the generated PDF in the same tab.
app.get("/openpdf", (req, res) => {
  if (fs.existsSync(`/tmp/merged.pdf`)) {
    res.sendFile(`/tmp/merged.pdf`);
  } else {
    res.render("failure", { errorMessage: "Merged file lost" });
  }
});

// Opens the about readme fetched from github
app.get("/about", (req, res) => {
  res.render("about");
});

// Initial landing page
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(3000, () => {
  console.log(`app listening on port 3000`);
});

module.exports = app;
