navigator.serviceWorker.addEventListener("message", function (event) {
  if (searchParams.has("receiving-file-share")) {
    // CODELAB: Add message event handler here.
    // Handle file share.
    const files = event.data.files;
    document.write("Received file share: " + files[0].name);
    console.log("Received files:", files);
    // ...
  }
});
