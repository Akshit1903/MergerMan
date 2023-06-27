const readmeURL =
  "https://raw.githubusercontent.com/Akshit1903/MergerMan/main/readme.md";
async function downloadReadMeFile() {
  let response = await fetch(readmeURL);
  if (response.status != 200) {
    throw new Error("Server Error");
  }
  // read response stream as text
  let text_data = await response.text();
  return text_data;
}
(async () => {
  let readmeText = await downloadReadMeFile();
  const markdownbox = document.getElementById("readme-content-box");
  const loader = document.getElementById("loader");
  markdownbox.innerHTML = readmeText;
  setTimeout(() => {
    markdownbox.classList.remove("d-none");
    loader.classList.add("d-none");
  }, 2000);
})();
