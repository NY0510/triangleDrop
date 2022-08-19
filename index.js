const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require("path");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("create_room", (roomName, callback) => {
    console.log("roomName: ", roomName);
    if (io.sockets.adapter.rooms.get(roomName) === undefined) {
      socket.join(roomName);
      socket.to(roomName).emit("welcome");
      callback(true);
    } else {
      callback(false);
    }
  });
  socket.on("join_room", (roomName, callback) => {
    console.log(io.sockets.adapter.rooms.get(roomName));
    if (io.sockets.adapter.rooms.get(roomName) === undefined) {
      callback(false);
    } else {
      socket.join(roomName);
      socket.to(roomName).emit("welcome");
      callback(true);
    }
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
