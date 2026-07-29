"use client";

import { Chat } from "@/app/_dto/chat";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { JSX } from "react/jsx-runtime";
import { shopping } from "./_lib/shopping";

const GREETING: Chat = {
  role: "agent",
  content:
    "어서 오세요~ 오늘은 뭐가 드시고 싶으세요? 말만 하면 메뉴 골라서 재료까지 싹 담아드릴게요!",
};

export default function Home(): JSX.Element {
  const [chats, setChats] = useState<Chat[]>([GREETING]);
  const [userInput, setUserInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 메시지가 늘어날 때마다 맨 아래로
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chats, isBusy]);

  const send = async (): Promise<void> => {
    const trimmedUserInput = userInput.trim();
    if (!trimmedUserInput || isBusy) return;

    setUserInput("");
    setIsBusy(true);
    await shopping(trimmedUserInput, (chat) =>
      setChats((prev) => [...prev, chat]),
    );
    setIsBusy(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") send();
  };

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="flex flex-none items-center gap-4 border-b-4 border-market-red bg-ink px-20 py-3.5">
        <div className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-cream bg-market-red text-[18px] font-extrabold text-cream">
          장
        </div>
        <div className="text-2xl font-extrabold tracking-[-0.6px] text-cream">
          장바구니를 부탁해
        </div>
        <div className="text-[15px] font-medium text-market-yellow">
          ~ 오늘도 싱싱한 게 들어왔어요 ~
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-[repeating-linear-gradient(0deg,var(--color-paper)_0_46px,var(--color-paper-line)_46px_48px)]">
        <div
          ref={listRef}
          className="mx-auto scrollbar-hidden flex w-full max-w-280 flex-1 flex-col gap-4 overflow-y-auto px-8 py-6"
        >
          {chats.map((chat, i) => (
            <div key={i} className="flex flex-none animate-pop-in flex-col">
              {chat.role === "user" ? (
                <div className="max-w-200 self-end rounded-[18px_18px_4px_18px] bg-ink px-5 py-3.5 text-[17px]/[1.6] font-medium text-cream">
                  {chat.content}
                </div>
              ) : (
                <div className="max-w-200 self-start rounded-[4px_18px_18px_18px] border-[1.5px] border-paper-border bg-surface px-5 py-4 text-[17px]/[1.65] font-medium text-foreground shadow-[2px_3px_0_rgba(43,58,85,0.08)]">
                  {chat.content}
                </div>
              )}
            </div>
          ))}

          {isBusy && (
            <div className="flex flex-none animate-pop-in">
              <div className="flex items-center gap-1.5 rounded-[4px_18px_18px_18px] border-[1.5px] border-paper-border bg-surface px-6 py-5">
                <span className="size-2 animate-blink rounded-full bg-market-red" />
                <span className="size-2 animate-blink rounded-full bg-market-red [animation-delay:0.2s]" />
                <span className="size-2 animate-blink rounded-full bg-market-red [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-280 flex-none px-8 pt-4 pb-6">
          <div className="flex items-center rounded-full border-2 border-ink bg-surface px-6 py-3.5 shadow-[3px_4px_0_rgba(43,58,85,0.12)]">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="뭐가 드시고 싶은지 말만 하세요~"
              className="flex-1 border-none bg-transparent text-[17px] font-medium text-foreground outline-none placeholder:text-base placeholder:font-normal placeholder:text-placeholder"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
