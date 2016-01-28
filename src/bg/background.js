chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
        chrome.tabs.create({
            url: 'http://keysurfer.github.io'
        }, function (tab) {
        });
    } else if (details.reason == 'update') {
    }
});