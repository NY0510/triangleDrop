// const { json } = require("express");
const socket = io();

const welcome = document.querySelector("#welcome");
const inRoom = document.querySelector("#inRoom");
const sendProgress = document.querySelector("progress#sendProgress");
const receiveProgress = document.querySelector("progress#receiveProgress");
const code = document.querySelector(".code");
const roomCodeInput = document.querySelector("#roomCodeInput");

roomCodeInput.addEventListener("keydown", (event) => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase();
});

roomCodeInput.addEventListener("keyup", (event) => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase();
});

code.addEventListener("click", () => {
  var tempElem = document.createElement("textarea");
  tempElem.value = code.innerHTML;
  document.body.appendChild(tempElem);

  tempElem.select();
  document.execCommand("copy");
  document.body.removeChild(tempElem);
});

let roomName;
let myPeerConnection;
let myDataChannel;
let fileReader;

let timestampStart;

let rxFileName;
let rxFileSize;

let receiveBuffer = [];
let receivedSize = 0;

inRoom.hidden = true;

// 나갈때
const initExit = () => {
  welcome.hidden = false;
  inRoom.hidden = true;
  code.innerHTML = `<span aria-busy="true" class="codeLoading">Please wait…</span>`;
  roomName = "";
  createRoomName();
};

// 들어갈때
const initRoom = () => {
  welcome.hidden = true;
  inRoom.hidden = false;
  code.innerHTML = roomName;
  document.querySelector(".codeLabel").innerHTML = "Current Code is";
};

const createRoomName = (result = false) => {
  if (!result) {
    roomName = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.emit("create_room", roomName, createRoomName);
  } else {
    code.innerHTML = roomName;
    document.querySelector(".waitLabel").hidden = false;
    makeConnection();
  }
};

createRoomName();

// const handleMakeRoom = async (evnet) => {
//   event.preventDefault();
//   await initRoom();

//   // socket.emit("join_room", roomName);
// };

const enterRoomCallback = (result) => {
  // toastr.options = {
  //   closeButton: true,
  //   debug: false,
  //   newestOnTop: true,
  //   progressBar: true,
  //   positionClass: "toast-top-right",
  //   preventDuplicates: false,
  //   onclick: null,
  //   showDuration: "300",
  //   hideDuration: "500",
  //   timeOut: "5000",
  //   extendedTimeOut: "500",
  //   showEasing: "swing",
  //   hideEasing: "linear",
  //   showMethod: "fadeIn",
  //   hideMethod: "fadeOut",
  // };

  if (result) {
    roomName = enterRoomForm.querySelector("input").value;
    initRoom();
    enterRoomForm.querySelector("input").value = "";
  } else {
    // // toastr.warning("Code doesn't exist");
    // document.querySelector(".noRoom").hidden = false;
    // document.querySelector(".noRoom").classList.add("animate__shakeX");
    // setTimeout(() => {
    //   document.querySelector(".noRoom").classList.remove("animate__shakeX");
    //   document.querySelector(".noRoom").hidden = true;
    // }, 2000);
    const button = enterRoomForm.querySelector("button");
    button.innerHTML = "Invalid Code";
    button.classList.add("errorCode");
    button.classList.add("animate__shakeX");
    button.disabled = true;
    setTimeout(() => {
      button.innerHTML = "Enter";
      button.disabled = false;
      button.classList.remove("errorCode");
      button.classList.remove("animate__shakeX");
    }, 2000);
  }
};

const handleEnterRoom = async (event) => {
  event.preventDefault();
  socket.emit(
    "join_room",
    enterRoomForm.querySelector("input").value,
    enterRoomCallback
  );
};

// var makeRoomForm = welcome.querySelector("#makeRoom");
// makeRoomForm.addEventListener("submit", handleMakeRoom);

var enterRoomForm = welcome.querySelector("#enterRoom");
enterRoomForm.addEventListener("submit", handleEnterRoom);

//RTC code

socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("DataChannel");
  myDataChannel.addEventListener("message", handleReceiveMessage);
  initRoom();
  console.log("made data channel / send offer");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
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

const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"], // 이건 뭐지
      },
    ],
  });

  myPeerConnection.addEventListener("icecandidate", handleIceCandidate);
};

const handleIceCandidate = (data) => {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
};

// send message with datachannel

const handleSendMessage = (event) => {
  event.preventDefault();
  const message = document.getElementById("messageInput");
  if (message.value.length < 0 || message.value.length > 20000) {
    alert("내용이 없거나 글자수 제한을 초과했습니다.");
  }
  myDataChannel.send(`{"type": "chat", "value": "${message.value}"}`);
  messageBlock.innerHTML += `<li>${message.value}</li>`;
  message.value = "";
};

messageForm = document.querySelector("#messageForm");
messageForm.addEventListener("submit", handleSendMessage);
const messageBlock = document.getElementById("messageBlock");

const handleReceiveMessage = (event) => {
  console.log(event.data);
  console.log(typeof event.data);
  // console.log(message);
  if (typeof event.data === "string") {
    const message = JSON.parse(event.data);
    if (message.type == "filesignal") {
      rxFileName = message.fileName;
      rxFileSize = message.fileSize;
      timestampStart = Date.now();
      receiveProgress.max = rxFileSize;
      receiveProgress.value = 0;
      receiveBuffer = [];
      receivedSize = 0;
      messageBlock.innerHTML += `<li>Receiving ${rxFileName}</li>`;
    } else {
      messageBlock.innerHTML += `<li>${message.value}</li>`;
    }
  } else if (typeof event.data === "object") {
    receiveBuffer.push(event.data);
    receivedSize += event.data.byteLength;
    receiveProgress.value = receivedSize;

    // const file = fileInput.files[0];

    if (receivedSize === rxFileSize) {
      const blob = new Blob(receiveBuffer);
      receiveBuffer = [];

      saveFile(blob);

      // const bitrate = Math.round(
      //   (receivedSize * 8) / (new Date().getTime() - timestampStart)
      // );
    }
  }
};

const saveFile = (blob) => {
  const li = document.createElement("li");
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML = "Download";
  //   link.download = "File Name";
  messageBlock.appendChild(li);
  li.appendChild(link);
};

// send file with datachannel

const handleSendFile = (event) => {
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

  const readSlice = (o) => {
    console.log("readSlice", o);
    const slice = file.slice(offset, o + chunkSize);
    fileReader.readAsArrayBuffer(slice); //fileReader 일해라
  };
  readSlice(0);
};

fileForm = document.querySelector("#fileForm");
fileForm.addEventListener("submit", handleSendFile);
