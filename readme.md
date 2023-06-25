# MergerMan

MergerMan is a simple, minimal yet robust and efficient PDF merger application that merges two or more PDF file into one PDF file; developed using EJS, Express, and Node.js. The application allows users to merge multiple PDF files into a single PDF document.

## Features

- Merge multiple PDF files into a single PDF document.
- User-friendly interface for selecting the PDF files.
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

## What I learnt

- Setting up an Express.js Server: How to set up a basic server using Express.js, including installing dependencies, configuring routes, and handling HTTP requests.
- EJS template creation: Acquired knowledge of how to use EJS to build reusable templates for data rendering and display.
- Handling File Uploads: Using middleware called `Multer`, I learned how to handle file uploads from the client to the server. Additionally, file handling on the server using JavaScript to check if a file already exists, delete, etc.
- Merging PDFs: The logic and techniques required to merge two or more PDF files into a single document. Taking input from the user of specific ranges of each file and combining them in a specific order to create the merged PDF.
- Error Handling:I encountered various potential errors, such as file upload failures or PDF processing issues. I learned how to handle and manage these errors gracefully, providing meaningful error messages to users and ensuring the server remains stable.
- User Experience and UI: I learned how to create a user-friendly interface for adding files, showing options, and offering feedback on the creation of merged PDFs.
- Deployment and Production Considerations: I learned about considerations for deploying the application in a production environment.

## Future Scope:

- Ability to rearrange the order of the PDF files before merging.
- Ensure scalability by reconfiguring sessions.
- Asynchronously waiting to send the merged PDF to the user, instead of waiting for a predefined time to delete the file.
