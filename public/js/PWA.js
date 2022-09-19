let fileList = [];

function getParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");

    console.log("window.onload");

    navigator.serviceWorker.addEventListener("message", function (event) {
      console.log("Received message from service worker: ", event.data);
      //if have url parameter "receiving-file-share"
      console.log(getParameter("receiving-file-share"));
      if (getParameter("receiving-file-share")) {
        const files = event.data.files;
        console.log("Received files:", files);
        let fileName = "";
        fileList = fileList.concat(files);
        files.forEach((i) => {
          fileName += `${i.name} `;
        });
        const sector0 = document.querySelector("#sector0");
        document.querySelector(".fileList").innerHTML = fileName;
        sector0.hidden = false;
      }

      // if (searchParams.has("receiving-file-share")) {
      //   // CODELAB: Add message event handler here.
      //   // Handle file share.

      //   // ...
      // }
    });

    navigator.serviceWorker.ready.then((reg) => {
      console.log("Service worker ready.", reg);
      // post massage to service worker
      reg.active.postMessage({ msg: "Hi from index.js" });
      // reg.active.postMessage("Hello from the main page");
    });
  });
}

// // Code to handle install prompt on desktop

// let deferredPrompt;
// const addBtn = document.querySelector("#butInstall");
// addBtn.style.display = "none";

// window.addEventListener("beforeinstallprompt", (e) => {
//   // Prevent Chrome 67 and earlier from automatically showing the prompt
//   e.preventDefault();
//   // Stash the event so it can be triggered later.
//   deferredPrompt = e;
//   // Update UI to notify the user they can add to home screen
//   addBtn.style.display = "block";

//   addBtn.addEventListener("click", () => {
//     // hide our user interface that shows our A2HS button
//     addBtn.style.display = "none";
//     // Show the prompt
//     deferredPrompt.prompt();
//     // Wait for the user to respond to the prompt
//     deferredPrompt.userChoice.then((choiceResult) => {
//       if (choiceResult.outcome === "accepted") {
//         console.log("User accepted the A2HS prompt");
//       } else {
//         console.log("User dismissed the A2HS prompt");
//       }
//       deferredPrompt = null;
//     });
//   });
// });
