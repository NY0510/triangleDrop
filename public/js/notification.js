function notificationPermisson() {
    if (window.Notification) {
        Notification.requestPermission();
    }
}

function sendNotification(title, message) {
    if (Notification.permission === "granted") {
        // If tab is active, don't send notification
        if (ifvisible.now()) {
            return;
        }
        const notification = new Notification(title, {
            body: message,
            icon: "/img/favicon/favicon.png",
        });
        setTimeout(notification.close.bind(notification), 3500);
    }
}

ifvisible.on("idle", function () {
    // if this tab is activated, send notification
    if (document.visibilityState === "visible") {
        let ii = 0;
        messageLog.forEach((obj) => {
            if (obj["timeStamp"] > new Date().getTime() - 60000) {
                ii++;
            }
        });
        if (ii > 0) {
            sendNotification("TriangleDrop - New message", ii + " new messages");
        }
        console.log(ii + " new messages");
    }
});
