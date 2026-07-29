"use client";

import { Chat } from "@/app/_dto/chat";
import { useState } from "react";
import { JSX } from "react/jsx-runtime";
import { shopping } from "./_lib/shopping";

export default function Home(): JSX.Element {
  const [chats, setChats] = useState<Chat[]>([]);
  const [userInput, setUserInput] = useState("");

  return (
    <main>
      {chats.map((chat, i) => (
        <p className="" key={i}>
          {chat.content}
        </p>
      ))}

      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="먹고 싶은 음식을 말해주세요"
        className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-sm"
      />
      <button
        type="button"
        onClick={() =>
          shopping(userInput, (chat) => setChats((prev) => [...prev, chat]))
        }
        className="w-full cursor-pointer rounded-md bg-neutral-900 py-2.5 text-sm text-white hover:bg-neutral-700"
      >
        장바구니 확인하기
      </button>
    </main>
  );
}
