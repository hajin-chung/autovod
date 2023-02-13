const refreshButton = document.getElementById("refresh");
const logContent = document.getElementById("log-content");
const messageContent = document.getElementById("messages-content");

const ws = new WebSocket("ws://localhost:1274");

ws.onmessage = (evt) => {
  messageContent.innerText = evt.data + "\n" + messageContent.innerText;
}

async function updateLogContent() {
  const res = await fetch("/api/log");
  const log = await res.text();
  logContent.innerText = log.split("\n").reverse().join("\n");
}

refreshButton.onclick = updateLogContent;

// init
const init = async () => {
  await updateLogContent();
}

init().catch(err => console.error(err))