const socket = io();

const $welcome = document.querySelector("#welcome");
const $inRoom = document.querySelector("#inRoom");
const $sendProgress = document.querySelector("progress#sendProgressBar");
const $receiveProgress = document.querySelector("progress#receiveProgressBar");
const $sendProgress2 = document.querySelector("progress#sendProgressBar2");
const $code = document.querySelector(".copyArea > .code");
const $inRoomCode = $inRoom.querySelector(".code");
const $codeLink = document.querySelector(".codeLink");
const $codeTooltip = document.querySelectorAll(".codeTooltip");
const $roomCodeInput = document.querySelector("#roomCodeInput");
const $sendProgressDiv = document.querySelector(".sendProgress");
const $receiveProgressDiv = document.querySelector(".receiveProgress");
const $filePrv = document.querySelector(".filesPreview");
const $dropZone = document.querySelector(".dragAndDrop");
const $enterRoomDiv = document.querySelector(".enterRoomDiv");
const $messageForm = document.querySelector("#messageForm");
const $codeQRcode = document.querySelector(".codeQRcode");
const $loadingScreen = document.querySelector(".loading");
const $enterRoomErrorLable = document.querySelector(".enterRoomErrorLable");

let sendState = false;
let acceptFile = 0;
let messageLog = [];

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
    $codeTooltip[0].innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    $codeTooltip[0].style = "color: #2bcc2b; font-weight: bold;";
    setTimeout(() => {
        $codeTooltip[0].innerHTML = "Click to copy";
        $codeTooltip[0].style = " ";
    }, 1000);
});
$codeLink.addEventListener("click", () => {
    var tempElem = document.createElement("textarea");
    tempElem.value = $codeLink.innerHTML;
    document.body.appendChild(tempElem);

    tempElem.select();
    document.execCommand("copy");
    document.body.removeChild(tempElem);
    $codeTooltip[1].innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    $codeTooltip[1].style = "color: #2bcc2b; font-weight: bold;";
    setTimeout(() => {
        $codeTooltip[1].innerHTML = "Click to copy";
        $codeTooltip[1].style = " ";
    }, 1000);
});
function getCookie(name) {
    let matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}
function setCookie(name, value, options = {}) {
    options = {
        path: "/",
        // 필요한 경우, 옵션 기본값을 설정할 수도 있습니다.
        ...options,
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}

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

window.addEventListener("load", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get("code");
    if (myParam) {
        if (getCookie("code") !== myParam) {
            setCookie("code", myParam);
            $roomCodeInput.value = myParam;
            $enterRoomForm.querySelector("button").click();
        } else {
            window.history.replaceState({}, document.title, "/");
        }
    }
});

// 나갈때
const initExit = () => {
    console.log("Back Action");
    socket.emit("exitRoom", roomName);
    messageLog = [];
    myDataChannel.onclose = null;

    myDataChannel.onclose = null;
    if (myPeerConnection) {
        myPeerConnection.close();
        myPeerConnection = null;
    }

    if (myDataChannel) {
        myDataChannel.close();
        myDataChannel = null;
    }

    createRoomName();
    $loadingScreen.style = "display: none;";
    $welcome.hidden = false;
    $inRoom.hidden = true;
    document.querySelector(".footerDiv").style = "";
    document.querySelector(".languageSelect").style = "";
    document.querySelector("#sector2").style = "";
    document.querySelector("#sector0").hidden = true;
    document.querySelector("#sector1").hidden = false;
    document.querySelector(".leftUserLable").hidden = true;
    $code.innerHTML = roomName;
    $inRoomCode.innerHTML = roomName;
    document.querySelector(".codeQRcode").style = "";
    document.querySelector(".codeQRcode").innerHTML = "";
    document.querySelector(".flexBlink").style = "";
    document.querySelector("nav").style = "";
    document.querySelector(".centerC").classList.add("center");
    $loadingScreen.style = "";
    acceptFile = 0;
};

// window.onpageshow = function (event) {
//   if (
//     event.persisted ||
//     (window.performance && window.performance.navigation.type == 2)
//   ) {
//     initExit();
//   }
// };

// when click on the history back button
window.onpopstate = function (event) {
    initExit();
};

// 들어갈때
const initRoom = () => {
    $loadingScreen.style = "display: flex;";
    document.querySelector(".leftUserLable").hidden = true;
    //pass
};

const createRoomName = (result = false) => {
    if (!result) {
        roomName = Math.random().toString(36).substring(2, 7).toUpperCase();
        roomName = roomName.replaceAll("O", "0");
        socket.emit("create_room", roomName, createRoomName);
    } else {
        $code.innerHTML = roomName;
        $inRoomCode.innerHTML = roomName;
        $codeLink.innerHTML = `https://triangledrop.obtuse.kr/?code=${roomName}`;
        const qrCode = new QRCode($codeQRcode, {
            text: `https://triangledrop.obtuse.kr/?code=${roomName}`,
            width: 130,
            height: 130,
            colorDark: theme.currentTheme.QRdarkColor,
            colorLight: theme.currentTheme.QRlightColor,
            correctLevel: QRCode.CorrectLevel.Q,
        });
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

const codeError = () => {
    const $button = $enterRoomForm.querySelector("button");

    const $roomCodeInput = document.querySelector("#roomCodeInput");
    $roomCodeInput.value = "";
    $enterRoomDiv.classList.add("animate__shakeX");
    $enterRoomDiv.style = "border-color:red;";
    $button.disabled = true;
    $enterRoomErrorLable.style = "opacity: 1;";
    setTimeout(() => {
        $enterRoomErrorLable.style = "";
        $button.disabled = false;
        $enterRoomDiv.classList.remove("errorCode");
        $enterRoomDiv.classList.remove("animate__shakeX");
        $enterRoomDiv.style = "";
    }, 2000);
};

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
        socket.emit("exitRoom", roomName);
        roomName = $enterRoomForm.querySelector("input").value.toUpperCase();
        initRoom();
        $enterRoomForm.querySelector("input").value = "";
    } else {
        codeError();
    }
};

const handleEnterRoom = async (event) => {
    event.preventDefault();
    if ($enterRoomForm.querySelector("input").value.length !== 5 || roomName === $enterRoomForm.querySelector("input").value.toUpperCase()) {
        enterRoomCallback(false);
        return;
    }
    socket.emit("join_room", $enterRoomForm.querySelector("input").value.toUpperCase(), enterRoomCallback);
};

// var makeRoomForm = welcome.querySelector("#makeRoom");
// makeRoomForm.addEventListener("submit", handleMakeRoom);

var $enterRoomForm = document.querySelector("#enterRoom");
$enterRoomForm.addEventListener("submit", handleEnterRoom);

//RTC code

const handleDataChannelOpen = (event) => {
    messageLog = [];
    console.log("Data channel is open and ready to be used.");
    $welcome.hidden = true;
    $inRoom.hidden = false;
    document.querySelector(".footerDiv").style = "display: none;";
    document.querySelector(".languageSelect").style = "display: none;";
    document.querySelector("#sector2").style = "display: none;";
    document.querySelector("#sector0").hidden = true;
    document.querySelector("#sector1").hidden = true;
    $code.innerHTML = roomName;
    $inRoomCode.innerHTML = roomName;
    document.querySelector(".codeQRcode").style = "display: none;";
    document.querySelector(".flexBlink").style = "display: none;";
    document.querySelector("nav").style = "display: none;";
    document.querySelector(".centerC").classList.remove("center");
    // if datachannel is closed
    myDataChannel.addEventListener("close", handleDataChannelClose);
    history.pushState(null, null, `?code=${roomName}`);
    setCookie("code", roomName);
    $loadingScreen.style = "display: none;";
    // notification permission
    notificationPermisson();
    if (fileList.length !== 0) {
        //form submit
        setTimeout(() => {
            document.querySelector("#messageSendButton").click();
        }, 500);
    }
};

const handleDataChannelClose = (event) => {
    console.log("The Data Channel is Closed");
    document.querySelector(".leftUserLable").hidden = false;
};

function waitToCompleteIceGathering(pc) {
    return new Promise((resolve) => {
        pc.addEventListener("icegatheringstatechange", (e) => e.target.iceGatheringState === "complete" && resolve(pc.localDescription));
    });
}

// peerA
socket.on("welcome", async () => {
    myDataChannel = myPeerConnection.createDataChannel("DataChannel");
    myDataChannel.addEventListener("open", handleDataChannelOpen);
    myDataChannel.addEventListener("message", handleReceiveMessage);
    initRoom();
    console.log("made data channel / send offer");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
});

// peerB
socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        console.log(event.channel);
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", handleReceiveMessage);
        myDataChannel.addEventListener("open", handleDataChannelOpen);
    });

    myPeerConnection.setRemoteDescription(offer);
    let answer = await myPeerConnection.createAnswer();

    // if (!myPeerConnection.canTrickleIceCandidates) {
    //   answer = await waitToCompleteIceGathering(myPeerConnection);
    // }

    socket.emit("answer", answer, roomName);
    myPeerConnection.setLocalDescription(answer);
    console.log("received the offer / send answer");
});

// peerA
socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    if (ice) {
        myPeerConnection.addIceCandidate(ice);
        console.log("received ice candidate");
    } else {
        myPeerConnection.addIceCandidate(ice);
        console.log("received null ice candidate");
    }
});

// peerA
const makeConnection = () => {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: ["stun:stun.obtuse.kr:5349"],
            },
            {
                urls: ["stun:stun.l.google.com:19302"],
            },
            {
                urls: ["turn:turn.obtuse.kr:5349", "turn:turn.obtuse.kr:5349?transport=tcp"],
                username: "turnserver",
                credential: "*Obtuse_turnServer",
            },
            // {
            //   urls: "turn:openrelay.metered.ca:443?transport=tcp",
            //   username: "openrelayproject",
            //   credential: "openrelayproject",
            // },
        ],
    });

    myPeerConnection.addEventListener("icecandidate", handleIceCandidate);
};

const handleIceCandidate = (data) => {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
};

const filter = (message, itFile = false, toSend = false) => {
    if (toSend) {
        let result = message.replaceAll(`"`, '\\"');
        result = result.replaceAll(`\\`, "\\\\");
        return result;
    }
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

const showMessage = (message, filterToggle = true, notification = true) => {
    const $message = document.createElement("div");
    $message.classList.add("message-content");
    // if message is http link
    if (
        message.match(
            /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi
        )
    ) {
        console.log("http link");
        const $link = document.createElement("a");
        $link.setAttribute("target", "_blank");
        $link.setAttribute("rel", "noopener noreferrer");
        $link.setAttribute("class", "messageLink");
        $link.innerHTML = filter(message);
        if (!message.match(/(http|https|Http|Https|rtsp|Rtsp):/)) {
            $link.setAttribute("href", "http://" + message);
        } else {
            $link.setAttribute("href", message);
        }

        $message.appendChild($link);
    } else {
        if (filterToggle) {
            $message.innerHTML = filter(message);
        } else {
            $message.innerHTML = message;
        }
    }
    messageBlock.innerHTML += $message.outerHTML;
    messageBlock.scrollTop = messageBlock.scrollHeight;
    messageLog.push({ message: message, timeStamp: new Date().getTime() });
    if (notification) {
        sendNotification("Triangle Drop", message);
    }
};

// send message with datachannel

const handleSendMessage = async (event) => {
    event.preventDefault();
    const message = document.getElementById("messageInput");
    const file = document.querySelector("#fileInput");
    if (file.files[0] !== undefined || fileList.length !== 0) {
        let i = 0;
        if (file.files[0] !== undefined) {
            fileList = fileList.concat(Array.from(file.files));
        }
        console.log(fileList);
        async function sendFileLoop() {
            if (sendState === false) {
                handleSendFile(fileList[i]);
                i++;
            }
            if (i < fileList.length) {
                setTimeout(sendFileLoop, 500);
            } else {
                file.value = "";
                fileList = [];
            }
        }
        await sendFileLoop();
    }
    if (message.value.length == 0) {
        return;
    }
    if (message.value.length > 20000) {
        const sendButton = document.querySelector("#messageSendButton");
        sendButton.innerHTML = "Message too long";
        $messageForm.classList.add("animate__shakeX");
        $messageForm.querySelector("input").style.borderColor = "red";
        sendButton.disabled = true;
        setTimeout(() => {
            sendButton.innerHTML = "Send";
            sendButton.disabled = false;
            $messageForm.classList.remove("animate__shakeX");
            $messageForm.querySelector("#messageInput").style.borderColor = "";
        }, 2000);
        return;
    }
    const messageToSend = filter(message.value, false, true);
    myDataChannel.send(`{"type": "chat", "value": "${messageToSend}"}`);
    showMessage(message.value, true, false);
    message.value = "";
};

$messageForm.addEventListener("submit", handleSendMessage);
const messageBlock = document.getElementById("messageBlock");

// on message
const handleReceiveMessage = (event) => {
    // console.log(event.data);
    // console.log(message);
    if (typeof event.data === "string") {
        const message = JSON.parse(event.data);
        if (message.type == "filesignal") {
            rxFileName = filter(message.fileName, true);
            rxFileSize = message.fileSize;
            showMessage(`Receiving ${rxFileName}`);
            if (rxFileSize / 1024 / 1024 > 20) {
                if (confirm("File size is over 20MB. Do you want to download?")) {
                    myDataChannel.send(`{"type": "file", "value": "download"}`);
                } else {
                    myDataChannel.send(`{"type": "file", "value": "cancel"}`);
                    showMessage("File transfer canceled", false);
                    return;
                }
            } else {
                myDataChannel.send(`{"type": "file", "value": "download"}`);
            }
            timestampStart = Date.now();
            $receiveProgress.max = rxFileSize;
            $receiveProgress.value = 0;
            $receiveProgressDiv.hidden = false;
            receiveBuffer = [];
            receivedSize = 0;
            document.querySelector(".rxProgressBarFileName").innerHTML = rxFileName;
            document.querySelector(".rxProgressBarFileSize").innerHTML = `0/${Math.round(rxFileSize / 1024 / 1024)}MB`;
        } else if (message.type == "rxdfilesize") {
            // progress2
            // console.log(message.value / 1024);
            $sendProgress2.value = message.value;
            if ($sendProgress.max == message.value) {
                showMessage(`${message.fileName} is sent`);
            }
        } else if (message.type == "file") {
            if (message.value == "download") {
                console.log("download");
                acceptFile = 1;
            } else if (message.value == "cancel") {
                console.log("cancel");
                showMessage("File transfer canceled");
                acceptFile = 2;
            }
        } else {
            // message
            showMessage(message.value);
            // if (messageToRead) {
            // }
        }
    } else if (typeof event.data === "object") {
        receiveBuffer.push(event.data);
        // console.log(event.data.byteLength);
        receivedSize += event.data.byteLength;
        // console.log(receivedSize);
        $receiveProgress.value = Math.round(receivedSize); //파폭에서 작동 안함.
        document.querySelector(".rxProgressBarFileSize").innerHTML = `${Math.round(receivedSize / 1024 / 1024)}/${Math.round(rxFileSize / 1024 / 1024)}MB`;
        myDataChannel.send(`{"type": "rxdfilesize", "value": "${receivedSize}", "fileName": "${rxFileName}"}`);

        // const file = fileInput.files[0];

        if (receivedSize === rxFileSize) {
            const blob = new Blob(receiveBuffer);
            receiveBuffer = [];
            clearInterval(statsInterval);
            statsInterval = null;
            // myDataChannel.send(`{"type": "chat", "value": "${rxFileName}File received"}`);

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
    $filePrv.style.display = "flex";
    console.log(event.target.files);
    Array.from(event.target.files).forEach((file) => {
        // const file = event.target.files[0];
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
        if (file.size > 1024 * 1024) {
            spanFileSizeAndType.innerHTML = `${Math.round(file.size / 1024 / 1024)}MB  ${file.type}`;
        } else if (file.size > 1024) {
            spanFileSizeAndType.innerHTML = `${Math.round(file.size / 1024)}KB  ${file.type}`;
        } else {
            spanFileSizeAndType.innerHTML = `${file.size}B  ${file.type}`;
        }
        // spanFileSizeAndType.innerHTML = `${Math.round(file.size / 1024 / 1024)}MB ${
        //   file.type
        // }`;
        div.appendChild(i);
        Box.appendChild(spanFileName);
        Box.appendChild(spanFileSizeAndType);
        div.appendChild(Box);
        document.querySelector(".filesPreview").appendChild(div);
    });
}

// send file with datachannel

const handleSendFile = (file) => {
    sendState = true;
    console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(" ")}`);
    $filePrv.style.display = "none";

    const fileNameToSend = filter(file.name, true);
    myDataChannel.send(`{"type": "filesignal", "fileName": "${fileNameToSend}", "fileSize": ${file.size}, "fileType": "${file.type}", "fileLastModified": ${file.lastModified}}`);
    showMessage(`Sending ${fileNameToSend}`, false, false);
    document.querySelector(".txProgressBarFileName").innerHTML = fileNameToSend;
    document.querySelector(".txProgressBarFileSize").innerHTML = `0/${Math.round(file.size / 1024 / 1024)}MB`;

    if (file.size === 0) {
        alert("File is empty");
        return;
    }

    let ii = 0;

    // wait for other user to accept
    const interval = setInterval(() => {
        if (acceptFile == 1) {
            clearInterval(interval);
            acceptFileSend(file);
        } else if (acceptFile == 2) {
            clearInterval(interval);
            filesignalS = false;
            acceptFile = 0;
            $sendProgressDiv.hidden = true;
            setTimeout(() => {
                sendState = false;
            }, 400);
            return;
        } else if (ii > 30) {
            showMessage("File transfer canceled");
            clearInterval(interval);
            filesignalS = false;
            acceptFile = 0;
            $sendProgressDiv.hidden = true;
            setTimeout(() => {
                sendState = false;
            }, 400);
            return;
        } else {
            console.log("waiting for other user to accept");
        }
        ii++;
    }, 500);
};

function acceptFileSend(file) {
    $sendProgress.max = file.size;
    $sendProgress2.max = file.size;
    $sendProgress.value = 0;
    $sendProgress2.value = 0;
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
        document.querySelector(".txProgressBarFileSize").innerHTML = `${Math.round(offset / 1024 / 1024)}/${Math.round(file.size / 1024 / 1024)}MB`;
        offset += event.target.result.byteLength;
        // console.log(`Sent ${offset} bytes`);
        $sendProgress.value = offset;
        // displayStats(); // 개발중
        if (offset < file.size) {
            // 아직 보낼 파일이 남았을때

            for (; 16666216 - myDataChannel.bufferedAmount < chunkSize; ) {
                // 버퍼에 남은 공간이 작을때
                // 버퍼 공간 16Mb를 넘지 않도록 계속 버퍼에 데이터를 넣는다.
                // console.log("wait");
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            readSlice(offset); // 슬라이스해서 보내기
        } else {
            // 보내기 완료
            // showMessage(`${fileNameToSend} is sent`, false);
            filesignalS = false;
            acceptFile = 0;
            $sendProgressDiv.hidden = true;
            setTimeout(() => {
                sendState = false;
            }, 400);
        }
    });

    const readSlice = (o) => {
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice); //fileReader 일해라
    };
    readSlice(0);
}

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
        const bitrate = Math.round(((byteNow - bytesPrev) * 8) / (activeCandidatePair.timestamp - timestampStart));
        timestampPrev = activeCandidatePair.timestamp;
        bytesPrev = byteNow;
        console.log(bitrate);
        if (bitrate > bitrateMax) {
            bitrateMax = bitrate;
        }
    }
}

// drag and drop

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
