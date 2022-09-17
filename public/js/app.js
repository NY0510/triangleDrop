const socket = io();

const $welcome = document.querySelector("#welcome");
const $inRoom = document.querySelector("#inRoom");
const $sendProgress = document.querySelector("progress#sendProgressBar");
const $receiveProgress = document.querySelector("progress#receiveProgressBar");
const $code = document.querySelector(".code");
const $roomCodeInput = document.querySelector("#roomCodeInput");
const $sendProgressDiv = document.querySelector(".sendProgress");
const $receiveProgressDiv = document.querySelector(".receiveProgress");
const $filePrv = document.querySelector(".filesPreview");
const $dropZone = document.querySelector(".dragAndDrop");

// $roomCodeInput.addEventListener("keydown", (event) => {
//   $roomCodeInput.value = $roomCodeInput.value.toUpperCase();
// });

// $roomCodeInput.addEventListener("keyup", (event) => {
//   $roomCodeInput.value = $roomCodeInput.value.toUpperCase();
// });

$code.addEventListener("click", () => {
  var tempElem = document.createElement("textarea");
  tempElem.value = $code.innerHTML;
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

let bytesPrev = 0;
let timestampPrev = 0;
let bitrateMax = 0;

let statsInterval = null;

$inRoom.hidden = true;
history.pushState(null, null, " ");

// 나갈때
const initExit = () => {
  $welcome.hidden = false;
  $inRoom.hidden = true;
  $code.innerHTML = `<span aria-busy="true" class="codeLoading">Please wait…</span>`;
  roomName = "";
  document.querySelector(".codeLabel").hidden = false;
  createRoomName();
};

// 들어갈때
const initRoom = () => {
  $welcome.hidden = true;
  $inRoom.hidden = false;
  document.querySelector(".footerDiv").style = "display: none;";
  document.querySelector("#sector2").style = "display: none;";
  $code.innerHTML = roomName;
  document.querySelector(".codeLabel").hidden = true;
  $code.classList.add("InRoom");
  document.querySelector(".center").classList.remove("center");
  history.pushState(null, null, `#${roomName}`);
};

const createRoomName = (result = false) => {
  if (!result) {
    roomName = Math.random().toString(36).substring(2, 7).toUpperCase();
    roomName = roomName.replaceAll("O", "0");
    socket.emit("create_room", roomName, createRoomName);
  } else {
    $code.innerHTML = roomName;
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
    if (
      roomName === $enterRoomForm.querySelector("input").value.toUpperCase()
    ) {
      $roomCodeInput.value = "";
      $roomCodeInput.placeholder = "Invalid Code OR Room is Full";
      $enterRoomDiv.classList.add("animate__shakeX");
      $enterRoomDiv.style = "border: 5px solid red;";
      $button.disabled = true;
      setTimeout(() => {
        $roomCodeInput.placeholder = "AAA00";
        $button.disabled = false;
        $enterRoomDiv.classList.remove("errorCode");
        $enterRoomDiv.classList.remove("animate__shakeX");
        $enterRoomDiv.style = "border: unset;";
      }, 2000);
    }
    roomName = $enterRoomForm.querySelector("input").value.toUpperCase();
    initRoom();
    $enterRoomForm.querySelector("input").value = "";
  } else {
    const $button = $enterRoomForm.querySelector("button");
    const $enterRoomDiv = document.querySelector(".enterRoomDiv");
    const $roomCodeInput = document.querySelector("#roomCodeInput");

    $roomCodeInput.value = "";
    $roomCodeInput.placeholder = "Invalid Code OR Room is Full";
    $enterRoomDiv.classList.add("animate__shakeX");
    $enterRoomDiv.style = "border: 5px solid red;";
    $button.disabled = true;
    setTimeout(() => {
      $roomCodeInput.placeholder = "AAA00";
      $button.disabled = false;
      $enterRoomDiv.classList.remove("errorCode");
      $enterRoomDiv.classList.remove("animate__shakeX");
      $enterRoomDiv.style = "border: unset;";
    }, 2000);
  }
};

const handleEnterRoom = async (event) => {
  event.preventDefault();
  if ($enterRoomForm.querySelector("input").value.length !== 5) {
    enterRoomCallback(false);
  }
  socket.emit(
    "join_room",
    $enterRoomForm.querySelector("input").value.toUpperCase(),
    enterRoomCallback
  );
};

// var makeRoomForm = welcome.querySelector("#makeRoom");
// makeRoomForm.addEventListener("submit", handleMakeRoom);

var $enterRoomForm = document.querySelector("#enterRoom");
$enterRoomForm.addEventListener("submit", handleEnterRoom);

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
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  });

  myPeerConnection.addEventListener("icecandidate", handleIceCandidate);
};

const handleIceCandidate = (data) => {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
};

const filter = (message, itFile = false) => {
  let result = message.replaceAll(/[\u0000-\u0019]+/g, "");
  result = result.replaceAll("<", "&lt;");
  result = result.replaceAll(">", "&gt;");
  result = result.replaceAll("'", "&apos;");
  result = result.replaceAll('"', "&quot;");
  result = result.replaceAll("/", "&#x2F;");
  result = result.replaceAll("\\", "&#x5C;");
  result = result.replaceAll("\n", "<br>");
  result = result.replaceAll("\r", "<br>");
  result = result.replaceAll("\t", "&nbsp;&nbsp;&nbsp;&nbsp;");
  if (!itFile) {
    result = result.replaceAll(" ", "&nbsp;");
  }

  return result;
};

// send message with datachannel

const handleSendMessage = (event) => {
  event.preventDefault();
  const message = document.getElementById("messageInput");
  const file = document.querySelector("#fileInput");
  if (file.files[0] !== undefined) {
    handleSendFile(file.files[0]);
    file.value = "";
  }
  if (message.value.length == 0) {
    return;
  }
  if (message.value.length > 20000) {
    const sendButton = document.querySelector("#messageSendButton");
    sendButton.innerHTML = "Message too long";
    messageForm.classList.add("animate__shakeX");
    messageForm.querySelector("input").style.borderColor = "red";
    sendButton.disabled = true;
    setTimeout(() => {
      sendButton.innerHTML = "Send";
      sendButton.disabled = false;
      messageForm.classList.remove("animate__shakeX");
      messageForm.querySelector("#messageInput").style.borderColor = "";
    }, 2000);
    return;
  }
  const messageToSend = filter(message.value);
  myDataChannel.send(`{"type": "chat", "value": "${messageToSend}"}`);
  messageBlock.innerHTML += `<div>${messageToSend}</div>`;
  messageBlock.scrollTop = messageBlock.scrollHeight;
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
      rxFileName = filter(message.fileName, true);
      rxFileSize = message.fileSize;
      timestampStart = Date.now();
      $receiveProgress.max = rxFileSize;
      $receiveProgress.value = 0;
      $receiveProgressDiv.hidden = false;
      receiveBuffer = [];
      receivedSize = 0;
      messageBlock.innerHTML += `<div>Receiving ${rxFileName}</div>`;
      messageBlock.scrollTop = messageBlock.scrollHeight;
      document.querySelector(".rxProgressBarFileName").innerHTML = rxFileName;
      document.querySelector(
        ".rxProgressBarFileSize"
      ).innerHTML = `0/${Math.round(file.size / 1024 / 1024)}MB`;
    } else {
      const messageToRead = filter(message.value);
      messageBlock.innerHTML += `<div>${messageToRead}</div>`;
      messageBlock.scrollTop = messageBlock.scrollHeight;
    }
  } else if (typeof event.data === "object") {
    receiveBuffer.push(event.data);
    // console.log(event.data.byteLength);
    receivedSize += event.data.byteLength;
    // console.log(receivedSize);
    $receiveProgress.value = Math.round(receivedSize); //파폭에서 작동 안함.
    document.querySelector(".rxProgressBarFileSize").innerHTML = `${Math.round(
      receivedSize / 1024 / 1024
    )}/${Math.round(rxFileSize / 1024 / 1024)}MB`;

    // const file = fileInput.files[0];

    if (receivedSize === rxFileSize) {
      const blob = new Blob(receiveBuffer);
      receiveBuffer = [];
      clearInterval(statsInterval);
      statsInterval = null;

      saveFile(blob);

      // const bitrate = Math.round(
      //   (receivedSize * 8) / (new Date().getTime() - timestampStart)
      // );
    }
  }
};

const saveFile = (blob) => {
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML = "Download";
  link.download = rxFileName;
  $receiveProgressDiv.hidden = true;
  //   link.download = "File Name";
  messageBlock.appendChild(link);
};

function handleChangeFile(event) {
  $filePrv.innerHTML = "";
  $filePrv.hidden = false;
  const file = event.target.files[0];
  const fileName = filter(file.name);
  const div = document.createElement("div");
  const i = document.createElement("i");
  const Box = document.createElement("div");
  const spanFileName = document.createElement("span");
  const spanFileSizeAndType = document.createElement("span");
  spanFileName.classList.add("prv", "prvFileName");
  spanFileSizeAndType.classList.add("prv", "prvFileSizeAndType");
  Box.classList.add("prv", "prvFileBox");
  i.classList.add("prv", "fa-regular", "fa-file");

  spanFileName.innerHTML = fileName;
  spanFileSizeAndType.innerHTML = `${Math.round(file.size / 1024 / 1024)}MB ${
    file.type
  }`;
  div.appendChild(i);
  Box.appendChild(spanFileName);
  Box.appendChild(spanFileSizeAndType);
  div.appendChild(Box);
  document.querySelector(".filesPreview").appendChild(div);
}

// send file with datachannel

const handleSendFile = (file) => {
  console.log(
    `File is ${[file.name, file.size, file.type, file.lastModified].join(" ")}`
  );
  $filePrv.hidden = true;

  const fileNameToSend = filter(file.name, true);
  myDataChannel.send(
    `{"type": "filesignal", "fileName": "${fileNameToSend}", "fileSize": ${file.size}, "fileType": "${file.type}", "fileLastModified": ${file.lastModified}}`
  );
  messageBlock.innerHTML += `<div>Sending ${fileNameToSend}</div>`;
  messageBlock.scrollTop = messageBlock.scrollHeight;
  document.querySelector(".txProgressBarFileName").innerHTML = fileNameToSend;
  document.querySelector(".txProgressBarFileSize").innerHTML = `0/${Math.round(
    file.size / 1024 / 1024
  )}MB`;

  if (file.size === 0) {
    alert("File is empty");
    return;
  }

  $sendProgress.max = file.size;
  $sendProgress.value = 0;
  $sendProgressDiv.hidden = false;
  const chunkSize = 262144;

  fileReader = new FileReader();
  let offset = 0;

  fileReader.addEventListener("error", (error) => {
    alert("Error reading file");
  });
  fileReader.addEventListener("abort", (event) => {
    alert("File reading aborted");
  });
  fileReader.addEventListener("load", async (event) => {
    myDataChannel.send(event.target.result);
    document.querySelector(".txProgressBarFileSize").innerHTML = `${Math.round(
      offset / 1024 / 1024
    )}/${Math.round(file.size / 1024 / 1024)}MB`;
    offset += event.target.result.byteLength;
    console.log(`Sent ${offset} bytes`);
    console.log(myDataChannel.bufferedAmount);
    $sendProgress.value = offset;
    // displayStats(); // 개발중
    if (offset < file.size) {
      // 아직 보낼 파일이 남았을때

      for (; 16777216 - myDataChannel.bufferedAmount < chunkSize; ) {
        // 버퍼에 남은 공간이 작을때
        // 버퍼 공간 16Mb를 넘지 않도록 계속 버퍼에 데이터를 넣는다.
        console.log("wait");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      readSlice(offset); // 슬라이스해서 보내기
    } else {
      messageBlock.innerHTML += `<div>${fileNameToSend} is sent</div>`; // 보내기 완료
      messageBlock.scrollTop = messageBlock.scrollHeight;
      $sendProgressDiv.hidden = true;
    }
  });

  const readSlice = (o) => {
    console.log("readSlice", o);
    const slice = file.slice(offset, o + chunkSize);
    fileReader.readAsArrayBuffer(slice); //fileReader 일해라
  };
  readSlice(0);
};

// 개발중
function displayStats() {
  const stats = myPeerConnection.getStats();
  console.log(stats);
  let activeCandidatePair;
  stats.forEach((report) => {
    if (report.type === "transport") {
      activeCandidatePair = stats.get(report.selectedCandidatePairId);
    }
  });
  if (activeCandidatePair) {
    if (timestampStart === activeCandidatePair.timestamp) {
      return;
    }
    const byteNow = activeCandidatePair.bytesReceived;
    const bitrate = Math.round(
      ((byteNow - bytesPrev) * 8) /
        (activeCandidatePair.timestamp - timestampStart)
    );
    timestampPrev = activeCandidatePair.timestamp;
    bytesPrev = byteNow;
    console.log(bitrate);
    if (bitrate > bitrateMax) {
      bitrateMax = bitrate;
    }
  }
}

function handleDragAndDropEnter(event) {
  event.stopPropagation();
  event.preventDefault();
  if (!$inRoom.hidden) {
    $dropZone.classList.add("drop-zone-active");
    console.log("DragAndDropEnter");
  }
}

$dropZone.addEventListener("dragleave", handleDragAndDropLeave);
$dropZone.addEventListener("dragover", handleDragAndDropOver, false);
$dropZone.addEventListener("drop", handleDragAndDropDrop, false);

function handleDragAndDropOver(evnet) {
  event.stopPropagation();
  event.preventDefault();
  console.log("DragAndDropOver");
}

function handleDragAndDropLeave(event) {
  event.stopPropagation();
  event.preventDefault();
  if (!$inRoom.hidden) {
    $dropZone.classList.remove("drop-zone-active");
    console.log("DragAndDropLeave");
  }
}

function handleDragAndDropDrop(event) {
  event.stopPropagation();
  event.preventDefault();
  $dropZone.classList.remove("drop-zone-active");
  console.log("DragAndDropDrop");
  const files = event.dataTransfer.files;
  $inRoom.querySelector("#fileInput").files = files;
  handleChangeFile({ target: { files: [files[0]] } });
}
