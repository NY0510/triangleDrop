const { json } = require("express");

const socket = io();

const welcome = document.getElementById("welcome");
const inRoom = document.getElementById("inRoom");

const sendProgress = document.querySelector("progress#sendProgress");
const receiveProgress = document.querySelector("progress#receiveProgress");

let roomName;
let myPeerConnection;
let myDataChannel;
let fileReader;

let timestampStart;

let receiveBuffer = [];
let receivedSize = 0;

inRoom.hidden = true;

async function initRoom() {
  welcome.hidden = true;
  inRoom.hidden = false;
  makeConnection();
}

async function handleWelcomeSubmit(evnet) {
  event.preventDefault();
  const input = document.querySelector("input");
  await initRoom();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm = welcome.querySelector("form");
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//RTC code

socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("DataChannel");
  myDataChannel.addEventListener("message", handleReceiveMessage);

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
  console.log("made data channel / send offer");
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", handleReceiveMessage);
  });

  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("received the offer / send answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
  console.log("received ice candidate");
});

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  });

  myPeerConnection.addEventListener("icecandidate", handleIceCandidate);
}

function handleIceCandidate(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

// send message with datachannel

messageForm = document.querySelector("#messageForm");
messageForm.addEventListener("submit", handleSendMessage);
const messageBlock = document.getElementById("message");

function handleSendMessage(event) {
  event.preventDefault();
  const message = document.getElementById("messageInput");
  myDataChannel.send(`{"type": "chat", "value": "${message.value}"}`);
  messageBlock.innerHTML += `<li>${message.value}</li>`;
  message.value = "";
}

function handleReceiveMessage(event) {
  console.log(event.data);
  console.log(typeof event.data);
  // console.log(message);
  if (typeof event.data === "string") {
    const message = JSON.parse(event.data);
    if (message.type == "filesignal") {
    }
    messageBlock.innerHTML += `<li>${message.value}</li>`;
  } else if (typeof event.data === "object") {
    receiveBuffer.push(event.data);
    receivedSize += event.data.byteLength;
    receiveProgress.value = receivedSize;

    const file = fileInput.files[0];

    if (receivedSize === file.size) {
      const blob = new Blob(receiveBuffer);
      receiveBuffer = [];

      saveFile(blob);

      // const bitrate = Math.round(
      //   (receivedSize * 8) / (new Date().getTime() - timestampStart)
      // );
    }
  }
}

function saveFile(blob) {
  const li = document.createElement("li");
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML = "Download";
  //   link.download = "File Name";
  messageBlock.appendChild(li);
  li.appendChild(link);
}

// send file with datachannel

fileForm = document.querySelector("#fileForm");
fileForm.addEventListener("submit", handleSendFile);

function handleSendFile(event) {
  event.preventDefault();
  const file = document.getElementById("fileInput").files[0];
  console.log(
    `File is ${[file.name, file.size, file.type, file.lastModified].join(" ")}`
  );

  myDataChannel.send(
    `{"type": "filesignal", "fileName": "${file.name}", "fileSize": ${file.size}, "fileType": "${file.type}", "fileLastModified": ${file.lastModified}}`
  );

  if (file.size === 0) {
    alert("File is empty");
    return;
  }

  sendProgress.max = file.size;
  const chunkSize = 16384;

  fileReader = new FileReader();
  let offset = 0;

  fileReader.addEventListener("error", (error) => {
    alert("Error reading file");
  });
  fileReader.addEventListener("abort", (event) => {
    alert("File reading aborted");
  });
  fileReader.addEventListener("load", (event) => {
    console.log("FileRead.onload", event);
    myDataChannel.send(event.target.result);
    offset += event.target.result.byteLength;
    console.log(`Sent ${offset} bytes`);
    sendProgress.value = offset;
    if (offset < file.size) {
      readSlice(offset);
    }
  });

  function readSlice(o) {
    console.log("readSlice", o);
    const slice = file.slice(offset, o + chunkSize);
    fileReader.readAsArrayBuffer(slice);
  }
  readSlice(0);

  // fileReader.onload = (event) => {};
  // fileReader.readAsDataURL(file);
}
