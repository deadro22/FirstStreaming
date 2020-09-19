const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const NodeMediaServer = require("node-media-server");
const axios = require("axios");

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: false,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    allow_origin: "*",
    mediaroot: "./media",
  },
};

app.set("view engine", "ejs");
app.use(express.static("public"));

var nms = new NodeMediaServer(config);
nms.run();

app.get("/", (req, res) => {
  res.redirect(`/stream/${uuidV4()}`);
});

app.get("/streams/current", async (req, res) => {
  const streams = await axios.get("http://192.168.1.7:8000/api/streams");
  const streamsCurrent = streams.data;
  res.render("streams", { streamsCurrent });
});

app.get("/stream/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("stream-join", (streamId) => {
    socket.join(streamId);
    socket.on("currentViews", () => {
      const views = io.sockets.adapter.rooms[streamId];
      socket.emit("currentViews", views.length);
    });
    socket.on("stream-message", (message, user) => {
      socket.emit("clear-message");
      io.sockets.to(streamId).emit("stream-shared", message, user);
    });
  });
});

server.listen(process.env.PORT || 3000);
