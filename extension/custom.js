var stringToBlob = function (str, mimetype) {
  var raw = str;
  var rawLength = raw.length;
  var uInt8Array = new Uint8Array(rawLength);
  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  var bb = new Blob([uInt8Array.buffer], { type: mimetype });
  return bb;
};

document.getElementById("export").addEventListener("click", async () => {
  let imei = document.getElementById('imei').value;
  let cookie = document.getElementById('cookie').value;
  let userAgent = document.getElementById('user-agent').value;
  if (imei && cookie && userAgent) {
    let credentials = {
      imei: imei,
      cookie: JSON.parse(cookie),
      userAgent: userAgent
    }
    var blob = stringToBlob(JSON.stringify(credentials, null, 2), "application/json");
    var url = window.webkitURL || window.URL || window.mozURL || window.msURL;
    var a = document.createElement('a');
    a.download = 'credentials.json';
    a.href = url.createObjectURL(blob);
    a.textContent = '';
    a.dataset.downloadurl = ['json', a.download, a.href].join(':');
    a.click();
    a.remove();
  }
})

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("refresh")
    .addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.reload(tabs[0].id);
      });
    });
});