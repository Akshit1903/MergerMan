# MergerMan

MergerMan is a simple, minimal yet robust and efficient PDF merger application developed using EJS, Express, and Node.js. The application allows users to merge multiple PDF files into a single PDF document.

## Features

- Merge multiple PDF files into a single PDF document.
- User-friendly interface for selecting and arranging the PDF files.
- Ability to enter the desired range of page numbers of individual PDF file.
- Option to preview the merged PDF document before saving.
- Easy-to-use and intuitive design.

## Installation

To run the PDF Merger App locally, follow these steps:

1. Clone the repository: `git clone https://github.com/Akshit1903/MergerMan.git`
2. Navigate to the project directory: `cd merger-man`
3. Install the dependencies: `npm install`
4. Start the server: `node index.js`
5. Open your web browser and go to `http://localhost:3000`

## Usage

1. Launch MergerMan in your web browser.
2. Click on the "Choose Files" button to select the PDF files you want to merge. You can select as many as you require.
3. Select the desired range of indexes of every file.
4. Preview the merged PDF document to ensure the order is correct.
5. Save the merged PDF document to your desired location on your computer.

## Technologies Used

- EJS: Templating engine for generating dynamic HTML templates.
- Express: Web application framework for Node.js.
- Node.js: JavaScript runtime environment.
- PDFMerger: Library for manipulating PDF files.

## Future Scope:

- Ability to rearrange the order of the PDF files before merging.
