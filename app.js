require("dotenv").config();
const fetch = require("node-fetch");
const WebSocket = require("ws");
const { createImage, createBlank } = require("./createImage");

const connection = new WebSocket("wss://api.lanyard.rest/socket");

function patchHiven(img) {
  fetch("https://api.hiven.io/v1/users/@me", {
    method: "PATCH",
    body: JSON.stringify({ header: `${img}` }),
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.TOKEN,
    },
  });
}

function patchHivenAndQuit(img) {
  fetch("https://api.hiven.io/v1/users/@me", {
    method: "PATCH",
    body: JSON.stringify({ header: `${img}` }),
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.TOKEN,
    },
  }).then((res) => {
    process.exit();
  });
}

connection.onopen = (event) => {
  connection.send(
    JSON.stringify({
      op: 2,
      d: { subscribe_to_ids: [process.env.USER_ID] },
    })
  );
  setInterval(() => {
    connection.send(
      JSON.stringify({
        op: 3,
      })
    );
  }, 30000);
};

connection.onmessage = ({ data }) => {
  const d = JSON.parse(data);
  switch (d.t) {
    case "PRESENCE_UPDATE":
      const data = d.d;
      if (data.spotify) {
        console.log(`Listening to ${data.spotify.song}`);
        createImage(
          data.spotify.song,
          data.spotify.artist.split("; ")[0],
          patchHiven
        );
      } else {
        console.log(`Not Listening anything.`);

        createBlank(patchHiven);
      }
      break;
  }
};

[
  "SIGHUP",
  "SIGINT",
  "SIGQUIT",
  "SIGILL",
  "SIGTRAP",
  "SIGABRT",
  "SIGBUS",
  "SIGFPE",
  "SIGUSR1",
  "SIGSEGV",
  "SIGUSR2",
  "SIGTERM",
].forEach((sig) => {
  process.on(sig, async () => {
    createBlank(patchHivenAndQuit);
  });
});
