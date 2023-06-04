// IIFE- Immediately Invoked Function Expression used here

// (() => {
//   "use strict";
//   const forms = document.querySelectorAll(".needs-validation");
//   Array.from(forms).forEach((form) => {
//     console.log(form);
//     form.addEventListener(
//       "submit",
//       (event) => {
//         if (!form.checkValidity()) {
//           event.preventDefault();
//           event.stopPropagation();
//           const errBox = document.getElementById("error-box");
//           errBox.classList.remove("invisible");
//           setTimeout(() => {
//             errBox.classList.add("invisible");
//           }, 3000);
//         }
//         // this class is added regardless of whether we have attached PDF or not
//         form.classList.add("was-validated");
//       },
//       false
//     );
//   });
// })();
