const removeRule = async () => {
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [1],
    });
  } catch (e) {
    console.error("removeRule 실패:", e);
  }
};

const waitForComplete = (tabId) =>
  new Promise((resolve) => {
    const cleanup = () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
    };

    const onUpdated = (id, info) => {
      if (id === tabId && info.status === "complete") {
        cleanup();
        resolve();
      }
    };

    const onRemoved = (id) => {
      if (id === tabId) {
        cleanup();
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    // listener 등록 직후 체크
    (async () => {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.status === "complete") {
          cleanup();
          resolve();
        }
      } catch {
        cleanup();
        resolve();
      }
    })();
  });

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (!message || message.action !== "openCart") return;

    (async () => {
      try {
        // 쿠키애서 global_sid만 교체하도록 수정
        const prevCookies = await chrome.cookies.getAll({
          domain: "lottemartzetta.com",
        });

        console.log("prevCookies", prevCookies);

        const newCookies = prevCookies
          .filter((cookie) => cookie.name !== "global_sid")
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .concat(`global_sid=${message.value}`);

        console.log("newCookies", newCookies);

        // basket 요청시 수정된 쿠리를 헤더에 담도록 규칙 등록
        await chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [1],
          addRules: [
            {
              id: 1,
              action: {
                type: "modifyHeaders",
                requestHeaders: [
                  {
                    header: "cookie",
                    operation: "set",
                    value: newCookies.join("; "),
                  },
                ],
              },
              condition: {
                urlFilter: "||lottemartzetta.com/",
                resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest"],
              },
            },
          ],
        });

        // basket 탭 열기
        const tab = await chrome.tabs.create({
          url: "https://lottemartzetta.com/basket",
        });

        // 탭 로드 완료 대기
        await waitForComplete(tab.id);

        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      } finally {
        // 규칙 제거
        await removeRule();
      }
    })();

    return true;
  },
);
