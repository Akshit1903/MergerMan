const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs/promises");
const ejs = require("ejs");
const PDFMerger = require("pdf-merger-js");
var merger = new PDFMerger();
const app = express();
const path = require("path");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

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
      await fs.unlink(file.path);
    }
    res.render("success");
  })();
});

app.get("/downloadpdf", (req, res) => {
  res.download(path.join(__dirname, "merged.pdf"));
});

app.get("/openpdf", (req, res) => {
  res.sendFile(path.join(__dirname, "merged.pdf"));
  // (async () => {
  //   await fs.unlink("merged.pdf");
  // })();
});

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(3000, () => {
  console.log(`app listening on port 3000`);
});
