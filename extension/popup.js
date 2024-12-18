window.addEventListener("load", function () {
  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === "IMEIValue") {
      document.getElementById("imei").value = request.imei;
    } else if (request.action === "CookiesValue") {
      document.getElementById("cookie").value = JSON.stringify(request.cookies);
    } else if (request.action === "UserAgent") {
      document.getElementById("user-agent").value = request.userAgent;
    }
  });
})