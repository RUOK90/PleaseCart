"use client";

import { useState } from "react";
import { JSX } from "react/jsx-runtime";

const extensionId = "kfdpecnbgglcnecdipkdebjbodblkebi";

type openCartResponse = { ok: true } | { ok: false; error?: string };

export default function Home(): JSX.Element {
  const [globalSid, setGlobalSid] = useState("");

  const handleOpen = (): void => {
    const value = globalSid.trim();

    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      alert("크롬 브라우저에서만 사용할 수 있습니다.");
      return;
    }

    chrome.runtime.sendMessage(
      extensionId,
      { action: "openCart", value },
      (response: openCartResponse) => {
        if (chrome.runtime.lastError) {
          alert("크롬 익스텐션이 설치되어 있지 않거나 응답이 없습니다.");
        } else if (!response || !response.ok) {
          alert(
            `실패: ${response && response.error ? response.error : "알 수 없는 오류"}`,
          );
        }
      },
    );
  };

  return (
    <main className="mx-auto my-20 max-w-105 px-5">
      <h1 className="mb-1 text-lg font-semibold">Zetta Cart Demo</h1>
      <p className="mt-0 mb-6 text-[13px] text-neutral-500">
        global_sid 값을 입력하고 버튼을 누르면 해당 장바구니 페이지가 열립니다.
      </p>

      <label htmlFor="globalSidInput" className="mb-1.5 block text-[13px]">
        global_sid
      </label>
      <input
        id="globalSidInput"
        type="text"
        value={globalSid}
        onChange={(e) => setGlobalSid(e.target.value)}
        placeholder="global_sid 값 붙여넣기"
        className="mb-3 w-full rounded-md border border-neutral-300 p-2.5 text-sm"
      />
      <button
        type="button"
        onClick={handleOpen}
        className="w-full cursor-pointer rounded-md bg-neutral-900 py-2.5 text-sm text-white hover:bg-neutral-700"
      >
        장바구니 확인하기
      </button>
    </main>
  );
}
