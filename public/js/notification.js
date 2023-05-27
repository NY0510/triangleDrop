const isSupported = () => "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

function notificationPermisson() {
    if (isSupported()) {
        if (window.Notification) {
            Notification.requestPermission((result) => {
                if (result === "granted") {
                    console.log("Notification permission granted");
                    notificationAllowed = true;
                } else {
                    console.log("Notification permission denied");
                    notificationAllowed = false;
                }
            });
        }
    }
}

function sendNotification(title, message) {
    if (notificationAllowed) {
        // If tab is active, don't send notification
        if (ifvisible.now()) {
            return;
        }
        const notification = new Notification(title, {
            body: message,
            icon: "/img/favicon/favicon.png",
        });
        setTimeout(notification.close.bind(notification), 4000);
    }
}

ifvisible.on("idle", function () {
    if (notificationAllowed) {
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
    }
});
