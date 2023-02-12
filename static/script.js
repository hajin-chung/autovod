const refreshButton = document.getElementById("refresh");
const toggleButton = document.getElementById("toggle");
const logContent = document.getElementById("log-content");
const logSection = document.getElementById("log");

async function updateLogContent() {
  const res = await fetch("/api/log");
  const log = await res.text();
  logContent.innerText = log.split("\n").reverse().join("\n");
}

refreshButton.onclick = updateLogContent;
toggleButton.onclick = () => {
  if (logSection.classList.contains("expand")) {
    logSection.classList.remove("expand");
  } else {
    logSection.classList.add("expand");
  }
}

// init
const init = async () => {
  await updateLogContent();
}

init().catch(err => console.error(err))