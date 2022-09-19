navigator.serviceWorker.addEventListener("message", function (event) {
  if (searchParams.has("receiving-file-share")) {
    // CODELAB: Add message event handler here.
    // Handle file share.
    const files = event.data.files;
    console.log("Received files:", files);
    // ...
  }
});
