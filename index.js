const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require("path");
const i18next = require("i18next");
const middleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");
const cookieParser = require("cookie-parser");
const { KeyObject } = require("crypto");

i18next
  .use(middleware.LanguageDetector)
  .use(Backend)
  .init({
    preload: ["en", "ko"],
    supportedLngs: ["en", "ko"],
    lng: ["en", "ko"],
    nonExplicitSupportedLngs: true,
    fallbackLng: "en",
    load: "languageOnly",
    cleanCode: true,
    backend: {
      loadPath: __dirname + "/locales/{{lng}}/translation.json",
      addPath: __dirname + "/locales/{{lng}}/translation.json",
    },
    detection: {
      order: ["querystring", "cookie", "header"],
      caches: ["cookie"],
      lookupCookie: "lang",
      lookupQuerystring: "lang",
      lookupHeader: "accept-language",
    },
  });

app.post(
  __dirname + "/locales/add/:lng/:ns",
  middleware.missingKeyHandler(i18next)
);
app.get(
  __dirname + "/locales/resources.json",
  middleware.getResourcesHandler(i18next)
);

app.use(
  middleware.handle(i18next, {
    ignoreRoutes: ["/foo"],
    removeLngFromUrl: false,
  })
);
app.use(express.static("public"));
app.use(cookieParser());
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render(path.join(__dirname, "public", "ejs", "index.ejs"));
});
app.post("/", (req, res) => {
  console.log(req.query);
  res.render(path.join(__dirname, "public", "ejs", "index.ejs"));
});
app.get("/index.html", (req, res) => {
  res.render(path.join(__dirname, "public", "ejs", "index.ejs"));
});
app.get("/unsupported", (req, res) => {
  res.render(path.join(__dirname, "public", "ejs", "unsupported.ejs"));
});
app.get("/offline.html", (req, res) => {
  res.render(path.join(__dirname, "public", "ejs", "offline.ejs"));
});
app.get("/privacy-policy", (req, res) => {
  res.render(path.join(__dirname, "public", "ejs", "privacy-policy.ejs"));
});
app.get("/tou", (req, res) => {
  res.render(path.join(__dirname, "public", "ejs", "tou.ejs"));
});
app.get("/about", (req, res) => {
  res.render(path.join(__dirname, "public", "ejs", "about.ejs"));
});
app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "sitemap.xml"));
});

app.get("/en", (req, res) => {
  // req.i18n.changeLanguage("en");
  res.cookie("lang", "en");
  res.redirect("/");
});
app.get("/ko", (req, res) => {
  // req.i18n.changeLanguage("ko");
  res.cookie("lang", "ko");
  res.redirect("/");
});

io.on("connection", (socket) => {
  console.log("a user connected");
  // console.log(io.sockets.adapter.rooms);

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
    if (
      io.sockets.adapter.rooms.get(roomName) === undefined ||
      io.sockets.adapter.rooms.get(roomName).size > 1
    ) {
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

app.use((req, res) => {
  res.status(404).render(path.join(__dirname, "public", "ejs", "404.ejs"));
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
