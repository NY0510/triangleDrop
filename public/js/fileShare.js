window.onload = function () {
  console.log("window.onload");
  navigator.serviceWorker.addEventListener("message", function (event) {
    document.querySelector("#sector1").write("message received");
    if (searchParams.has("receiving-file-share")) {
      // CODELAB: Add message event handler here.
      // Handle file share.
      const files = event.data.files;
      document.write("Received file share: " + files[0].name);
      console.log("Received files:", files);
      // ...
    }
  });
};
