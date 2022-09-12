const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require("path");
const i18nF = require("./i18n");
const cookieParser = require("cookie-parser");

app.use(express.static("public"));
app.use(cookieParser());
app.use(i18nF);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render(res.__(path.join(__dirname, "public", "html", "index.ejs")));
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("create_room", (roomName, callback) => {
    if (io.sockets.adapter.rooms.get(roomName) === undefined) {
      socket.join(roomName);
      socket.to(roomName).emit("welcome");
      callback(true);
    } else {
      callback(false);
    }
  });
  socket.on("join_room", (roomName, callback) => {
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
