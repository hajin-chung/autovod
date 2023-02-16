const WEBSOCKET_ENDPOINT = "wss://ingjjal.tk/ws";
// const WEBSOCKET_ENDPOINT = "ws://localhost/ws";
const ws = new WebSocket(WEBSOCKET_ENDPOINT);

ws.onmessage = (evt) => {
  messageContent.innerText = evt.data + "\n" + messageContent.innerText;
}


const refreshButton = document.getElementById("refresh");
const logContent = document.getElementById("log-content");
const messageContent = document.getElementById("messages-content");
const loginInput = document.getElementById("login-input");
const loginButton = document.getElementById("login-button");
const testWebhookButton = document.getElementById("test-webhook-button");
const uploadInput = document.getElementById("upload-input");
const testUploadButton = document.getElementById("test-upload-button");
const statusRefreshButton = document.getElementById("refresh-status");
const uploaderStatus = document.getElementById("uploader-status");
const downloaderStatus = document.getElementById("downloader-status");

async function updateLogContent() {
  const res = await fetch("/api/log");
  const log = await res.text();
  logContent.innerText = log;
}

async function updateStatus() {
  const res = await fetch("/api/status");
  const status = await res.json();
  uploaderStatus.innerText = status.uploader;
  downloaderStatus.innerText = status.downloader;
}

refreshButton.onclick = updateLogContent;
statusRefreshButton.onclick = updateStatus;
loginButton.onclick = async () => {
  const login = loginInput.value;
  await fetch(`/api/test/download?login=${login}`);
  loginInput.value = "";
}
testWebhookButton.onclick = async () => {
  const body = {
    "subscription": {
      "id": "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
      "type": "stream.online",
      "version": "1",
      "status": "enabled",
      "cost": 0,
      "condition": {
        "broadcaster_user_id": "150664679"
      },
      "transport": {
        "method": "webhook",
        "callback": "https://example.com/webhooks/callback"
      },
      "created_at": "2019-11-16T10:11:12.634234626Z"
    },
    "event": {
      "id": "9001",
      "broadcaster_user_id": "150664679",
      "broadcaster_user_login": "nanajam777",
      "broadcaster_user_name": "우정잉",
      "type": "live",
      "started_at": "2020-10-11T10:11:12.123Z"
    }
  }

  await fetch(`/api/webhook/callback`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

testUploadButton.onclick = async () => {
  const path = uploadInput.value;
  await fetch(`/api/test/upload?path=${path}`);
  uploadInput.value = "";
}

// init
const init = () => {
  updateLogContent();
  updateStatus();
}

init()