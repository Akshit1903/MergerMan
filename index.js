const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fsp = require("fs/promises");
const fs = require("fs");
const PDFMerger = require("pdf-merger-js");
const session = require("express-session");
const pdfPageCounter = require("pdf-page-counter");
const path = require("path");

const app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.post("/upload-pdf", upload.array("pdf-files"), function (req, res, next) {
  const files = req.files;
  const mergedFilePath = path.join(__dirname, "merged.pdf");
  (async () => {
    for (let file of files) {
      console.log(file);
      await merger.add(file.path);
    }
    await merger.save("merged.pdf");
    for (let file of files) {
      await fsp.unlink(file.path);
    }
    res.render("success");
  })();
});

app.post("/", upload.array("pdf-files"), (req, res) => {
  const pdfFiles = req.files;
  (async () => {
    for (let i = 0; i < pdfFiles.length; i++) {
      let dataBuffer = fs.readFileSync(pdfFiles[i].path);
      let fileData = await pdfPageCounter(dataBuffer);
      pdfFiles[i]["pages"] = fileData.numpages;
    }
    req.session.pdfFilesInfo = pdfFiles;
    res.redirect("/filters");
  })();
});

app.post("/filters", (req, res) => {
  const pdfFiles = req.session.pdfFilesInfo;
  const startingPageNumbers = req.body.startingPageNumbers;
  const endingPageNumbers = req.body.endingPageNumbers;
  (async () => {
    for (let i = 0; i < pdfFiles.length; i++) {
      const range = startingPageNumbers[i] + "-" + endingPageNumbers[i];
      console.log(range);
      await merger.add(pdfFiles[i].path, range);
    }
    await merger.save("merged.pdf");
    for (let i = 0; i < pdfFiles.length; i++) {
      await fsp.unlink(pdfFiles[i].path);
    }
    merger.reset();
    res.render("success");
  })();
});

app.get("/filters", (req, res) => {
  const pdfFiles = req.session.pdfFilesInfo;
  res.render("filters", { pdfFiles: pdfFiles });
});

app.get("/downloadpdf", (req, res) => {
  res.download(path.join(__dirname, "merged.pdf"));
});

app.get("/openpdf", (req, res) => {
  res.sendFile(path.join(__dirname, "merged.pdf"));
  // (async () => {
  //   await fsp.unlink("merged.pdf");
  // })();
});

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(3000, () => {
  console.log(`app listening on port 3000`);
});
