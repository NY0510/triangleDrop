var agent = navigator.userAgent.toLowerCase();
console.log(agent);
if (
  (navigator.appName == "Netscape" && agent.indexOf("trident") != -1) ||
  agent.indexOf("msie") != -1 ||
  agent.indexOf("edge") != -1 ||
  agent.indexOf("firefox") != -1
) {
  if (window.location.href.indexOf("unsupported") > -1) {
    //pass
  } else {
    window.location.href = "/html/unsupported.html";
  }
} else {
  if (window.location.href.indexOf("unsupported") > -1) {
    window.location.href = "/";
  }
}
