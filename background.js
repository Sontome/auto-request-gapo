chrome.runtime.onInstalled.addListener(() => {
    console.log("Gapo Auto Click installed");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type !== "START_GAPO_FROM_SOURCE") return;

    const payload = msg.payload || {};
    const targetUrl = "https://www.gapowork.vn/approval/approver?mode=settlement";

    chrome.tabs.create({ url: targetUrl }, (tab) => {
        if (!tab?.id) {
            sendResponse({ ok: false, error: "Cannot create tab" });
            return;
        }

        const tabId = tab.id;

        const onUpdated = (updatedTabId, info) => {
            if (updatedTabId !== tabId) return;
            if (info.status !== "complete") return;

            chrome.tabs.sendMessage(
                tabId,
                {
                    type: "RUN_SETTLEMENT_WITH_DATA",
                    payload
                },
                () => {
                    const err = chrome.runtime.lastError;
                    if (err) {
                        console.warn("Send message to gapowork tab failed:", err.message);
                    }
                }
            );

            chrome.tabs.onUpdated.removeListener(onUpdated);
        };

        chrome.tabs.onUpdated.addListener(onUpdated);
        sendResponse({ ok: true, tabId });
    });

    return true;
});