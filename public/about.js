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
  document.getElementById("readme-content-box").innerHTML = readmeText;
})();
