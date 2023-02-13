const ws = new WebSocket("ws://localhost:1274");

ws.onmessage = (evt) => {
  messageContent.innerText = evt.data + "\n" + messageContent.innerText;
}


const refreshButton = document.getElementById("refresh");
const logContent = document.getElementById("log-content");
const messageContent = document.getElementById("messages-content");
const loginInput = document.getElementById("login-input");
const loginButton = document.getElementById("login-button");
const testButton = document.getElementById("test-button");

async function updateLogContent() {
  const res = await fetch("/api/log");
  const log = await res.text();
  logContent.innerText = log.split("\n").reverse().join("\n");
}

refreshButton.onclick = updateLogContent;
loginButton.onclick = async () => {
  const login = loginInput.value;
  await fetch(`/api/test/download?login=${login}`);
  loginInput.value = "";
}
testButton.onclick = async () => {
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

// init
const init = async () => {
  await updateLogContent();
}

init().catch(err => console.error(err))