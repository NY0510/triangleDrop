const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  io.emit("chat message", "누군가가 입장했습니다.");
  socket.on("disconnect", () => {
    io.emit("chat message", "누군가가 퇴장했습니다.");
  });
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
