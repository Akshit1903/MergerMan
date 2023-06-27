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
const MongoDBStore = require("connect-mongodb-session")(session);
// Variables Initialized
const app = express();
// configure MongoDB Database
// const store = new MongoDBStore({
//   uri: "mongodb+srv://akshit19:sGUuwKTtlK3znU4R@mergermancluster.3l1agd0.mongodb.net/",
//   collection: "sessions",
// });
var sess = {
  secret: "SECRETKEY123",
  cookie: { maxAge: 36000000 },
  cookie: {},
  resave: false,
  saveUninitialized: true,
  // store: store,
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
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// POST REQUESTS

// PDFs files are loaded onto the server
// PDF info array is stored and info about the number of pages is added asynchronously
app.post("/", upload.array("pdf-files"), async (req, res) => {
  const pdfFiles = req.files;
  // IIFE invoked as current scope cannot be async
  await (async () => {
    for (let i = 0; i < pdfFiles.length; i++) {
      const pdfBuffer = fs.readFileSync(pdfFiles[i].path);
      const pdfFilePages = await countPages.PdfCounter.count(pdfBuffer);
      pdfFiles[i]["pages"] = pdfFilePages;
    }
    if (req.body.submit === "Quick Merge") {
      (async () => {
        for (let i = 0; i < pdfFiles.length; i++) {
          await merger.add(pdfFiles[i].path);
        }
        await merger.save(`/tmp/merged.pdf`);
        for (let i = 0; i < pdfFiles.length; i++) {
          // Deleting files as no longer needed
          await fsp.unlink(pdfFiles[i].path);
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
  }, 10000);
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
        const range = startingPageNumbers[i] + "-" + endingPageNumbers[i];
        await merger.add(pdfFiles[i].path, range);
      }
    }
    await merger.save(`/tmp/merged.pdf`);
    for (let i = 0; i < pdfFiles.length; i++) {
      // Deleting files as no longer needed
      await fsp.unlink(pdfFiles[i].path);
    }
    // Buffer is reset as sometimes previous session files were loaded
    merger.reset();
    req.session.pdfFilesInfo = [];
    deleteMergedPDF();
    res.render("success");
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

module.exports.handler = serverless(app);
