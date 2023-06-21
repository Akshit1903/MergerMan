// Imports
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fsp = require("fs/promises");
const fs = require("fs");
const PDFMerger = require("pdf-merger-js");
const session = require("express-session");
const pdfPageCounter = require("pdf-page-counter");
const path = require("path");

// Variables Initialized
const app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));
app.set("views", path.join(__dirname, "/views"));
app.use(bodyParser.urlencoded({ extended: true }));
// Express Session- config
app.use(
  session({
    secret: "SECRETKEY123",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true },
  })
);
const merger = new PDFMerger();
//Multer- path and new names of incoming files are configured
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fullPath = path.join(__dirname, "/tmp");
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// POST REQUESTS

// PDFs files are loaded onto the server
// PDF info array is stored and info about the number of pages is added asynchronously
app.post("/", upload.array("pdf-files"), async (req, res) => {
  // setTimeout(async () => {

  // }, 8000);
  const pdfFiles = req.files;

  // IIFE invoked as current scope cannot be async
  // await (async () => {
  //   for (let i = 0; i < pdfFiles.length; i++) {
  //     // console.log(path.join(__dirname, pdfFiles[i].path));
  //     let dataBuffer = fs.readFileSync(path.join(__dirname, pdfFiles[i].path));
  //     let fileData = await pdfPageCounter(dataBuffer);
  //     pdfFiles[i]["pages"] = fileData.numpages;
  //   }
  //   req.session.pdfFilesInfo = pdfFiles;
  //   res.redirect("/filters");
  // })();
  const cur = async () => {
    for (let i = 0; i < pdfFiles.length; i++) {
      // console.log(path.join(__dirname, pdfFiles[i].path));
      const pdfFilePath = path.join(__dirname, pdfFiles[i].path);
      // while (!fs.existsSync(pdfFilePath)) {}
      // if (fs.existsSync(pdfFilePath)) {
      //   res.redirect("/filters");
      // }
      let dataBuffer = fs.readFileSync(pdfFilePath);
      let fileData = await pdfPageCounter(dataBuffer);
      pdfFiles[i]["pages"] = fileData.numpages;
    }
    req.session.pdfFilesInfo = pdfFiles;
    res.redirect("/filters");
  };
  await cur();
});

// PDF info array and page numbers arrays is read from the current session
// each PDF is added one by one w.r.t their page numbers
app.post("/filters", (req, res) => {
  const pdfFiles = req.session.pdfFilesInfo;
  const startingPageNumbers = req.body.startingPageNumbers;
  const endingPageNumbers = req.body.endingPageNumbers;
  console.log(pdfFiles);

  // IIFE invoked because current scope can't be async
  (async () => {
    // Concatenating all files one by one
    for (let i = 0; i < pdfFiles.length; i++) {
      const range = startingPageNumbers[i] + "-" + endingPageNumbers[i];
      await merger.add(pdfFiles[i].path, range);
    }
    await merger.save("merged.pdf");
    for (let i = 0; i < pdfFiles.length; i++) {
      // Deleting files as no longer needed
      await fsp.unlink(pdfFiles[i].path);
    }
    // Buffer is reset as sometimes previous session files were loaded
    merger.reset();
    res.render("success");
  })();
});

// GET REQUESTS
// PDF files information object array is read from the current session
// The array is used to render the filter route.
app.get("/filters", (req, res) => {
  const pdfFiles = req.session.pdfFilesInfo;
  if (!pdfFiles) {
    res.send("error!");
    return;
  }
  res.render("filters", { pdfFiles: pdfFiles });
});

// Download process is started
app.get("/downloadpdf", (req, res) => {
  res.download(path.join(__dirname, "merged.pdf"));
});

// Opens the generated PDF in the same tab.
app.get("/openpdf", (req, res) => {
  res.sendFile(path.join(__dirname, "merged.pdf"));
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
