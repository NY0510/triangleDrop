var agent = navigator.userAgent.toLowerCase();
console.log(agent);
if ((navigator.appName == "Netscape" && agent.indexOf("trident") != -1) || agent.indexOf("msie") != -1 || agent.indexOf("edge") != -1) {
    if (window.location.href.indexOf("unsupported") > -1) {
        //pass
    } else {
        window.location.href = "/unsupported";
    }
} else {
    if (window.location.href.indexOf("unsupported") > -1) {
        window.location.href = "/";
    }
    if (agent.indexOf("firefox")) {
    }
}

//if (
//   (navigator.appName == "Netscape" && agent.indexOf("trident") != -1) ||
//   agent.indexOf("msie") != -1 ||
//   agent.indexOf("edge") != -1 ||
//   agent.indexOf("firefox") != -1
// )
