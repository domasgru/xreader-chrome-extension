chrome.action.onClicked.addListener((tab) => {
    if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action: "toggleApp" });
    }
});