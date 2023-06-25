// IIFE- Immediately Invoked Function Expression used here

(() => {
  "use strict";
  const forms = document.querySelectorAll(".needs-validation");
  Array.from(forms).forEach((form) => {
    const rangeValidity = (rangeArray) => {
      // check if low range greater than high range
      let res = false;
      const children = Array.from(rangeArray.children);
      children.forEach((rangeElement) => {
        const lowRangeElement =
          rangeElement.firstElementChild.nextElementSibling.lastElementChild;
        const highRangeElement = rangeElement.lastElementChild.lastElementChild;
        if (
          Number.parseInt(lowRangeElement.value) >
          Number.parseInt(highRangeElement.value)
        ) {
          res = true;
        }
      });
      return res;
    };
    form.addEventListener(
      "submit",
      (event) => {
        if (
          !form.checkValidity() ||
          rangeValidity(form.firstElementChild.lastElementChild)
        ) {
          event.preventDefault();
          event.stopPropagation();
          const errBox = document.getElementById("error-box");
          errBox.classList.remove("invisible");
          setTimeout(() => {
            errBox.classList.add("invisible");
          }, 3000);
        }
        form.classList.add("was-validated");
      },
      false
    );
  });
})();

// Add some additional configurations to submit button WITHOUT losing post request functionality

// const submitButton = document.getElementById("submit-btn");
// submitButton.onclick = (e) => {
//   submitButton.setAttribute("disabled", true);
//   const openSuccessPage = () => {
//     document.location.href = "/success";
//   };
//   setTimeout(openSuccessPage, 500);
// };
