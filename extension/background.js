function captureRequests() {
  chrome.webRequest.onBeforeRequest.addListener(function (details) {
    let url = details.url;
    let imeiFound = false;
    let imeiValue = "Not Found";
    if (url.includes("/api/login/getServerInfo") && url.indexOf("imei=") > -1) {
      let params = new URLSearchParams(new URL(url).search);
      imeiFound = true;
      imeiValue = params.get("imei");
      chrome.runtime.sendMessage({ action: "IMEIValue", imei: imeiValue });
    }

    if (imeiFound && url.includes("chat.zalo.me")) {
      chrome.cookies.getAll({ url: url }, function (cookies) {
        let parsedCookies = cookies.map(cookie => ({
          domain: cookie.domain,
          expirationDate: cookie.expirationDate || null,
          hostOnly: cookie.hostOnly,
          httpOnly: cookie.httpOnly,
          name: cookie.name,
          path: cookie.path,
          sameSite: cookie.sameSite || "no_restriction",
          secure: cookie.secure,
          session: cookie.session,
          storeId: cookie.storeId || null,
          value: cookie.value
        }));

        chrome.runtime.sendMessage({ action: "CookiesValue", cookies: parsedCookies });
      });
    }

    let userAgent = navigator.userAgent;
    chrome.runtime.sendMessage({ action: "UserAgent", userAgent: userAgent });
  },
    { urls: ["<all_urls>"] },
    ["requestBody"]
  );
}

captureRequests();