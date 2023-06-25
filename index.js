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
// Variables Initialized
const app = express();
var sess = {
  secret: "SECRETKEY123",
  cookie: { maxAge: 36000000 },
  cookie: {},
  resave: false,
  saveUninitialized: true,
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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp");
  },
  filename: (req, file, cb) => {
    // cb(null, Date.now() + "-" + file.originalname);
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Global array

let pdfFiles = [];

// POST REQUESTS

// PDFs files are loaded onto the server
// PDF info array is stored and info about the number of pages is added asynchronously
app.post("/", upload.array("pdf-files"), async (req, res) => {
  // setTimeout(async () => {

  // }, 8000);
  pdfFiles = req.files;

  // IIFE invoked as current scope cannot be async
  await (async () => {
    for (let i = 0; i < pdfFiles.length; i++) {
      // console.log(path.join(__dirname, pdfFiles[i].path));
      // const pdfFilePages = await pdfjsLib.getDocument(pdfFiles[i].path)
      //   .numpages;
      // pdfFiles[i]["pages"] = pdfFilePages;
      // pdfjsLib.getDocument(pdfFiles[i].path).then(function (doc) {
      //   pdfFiles[i]["pages"] = doc.numPages;
      // });
      const pdfBuffer = fs.readFileSync(pdfFiles[i].path);
      const pdfFilePages = await countPages.PdfCounter.count(pdfBuffer);
      pdfFiles[i]["pages"] = pdfFilePages;
    }
    // req.session.pdfFilesInfo = pdfFiles;
    res.redirect("/filters");
  })();
});

// PDF info array and page numbers arrays is read from the current session
// each PDF is added one by one w.r.t their page numbers
app.post("/filters", (req, res) => {
  // const pdfFiles = req.session.pdfFilesInfo;
  if (!pdfFiles || pdfFiles.length === 0) {
    res.send("error2!");
    return;
  }
  const startingPageNumbers = req.body.startingPageNumbers;
  const endingPageNumbers = req.body.endingPageNumbers;
  // console.log(pdfFiles);

  // IIFE invoked because current scope can't be async
  (async () => {
    // Concatenating all files one by one
    for (let i = 0; i < pdfFiles.length; i++) {
      const range = startingPageNumbers[i] + "-" + endingPageNumbers[i];
      await merger.add(pdfFiles[i].path, range);
    }
    await merger.save(`/tmp/merged.pdf`);
    for (let i = 0; i < pdfFiles.length; i++) {
      // Deleting files as no longer needed
      await fsp.unlink(pdfFiles[i].path);
    }
    // Buffer is reset as sometimes previous session files were loaded
    merger.reset();
    pdfFiles = [];
    res.download(`/tmp/merged.pdf`);
  })();
});

// GET REQUESTS
// PDF files information object array is read from the current session
// The array is used to render the filter route.
app.get("/filters", (req, res) => {
  // const pdfFiles = req.session.pdfFilesInfo;
  if (!pdfFiles) {
    res.send("error1!");
  }
  res.render("filters", { pdfFiles: pdfFiles });
});

// Download process is started
app.get("/downloadpdf", (req, res) => {
  res.download(`/tmp/merged.pdf`);
});

// Opens the generated PDF in the same tab.
app.get("/openpdf", (req, res) => {
  res.sendFile(`/tmp/merged.pdf`);
  // (async () => {
  //   await fsp.unlink("merged.pdf");
  // })();
});

// Initial landing page
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(3000, () => {
  console.log(`app listening on port 3000`);
});

module.exports = app;
