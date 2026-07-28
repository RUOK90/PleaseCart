"use client";

import { Chat } from "@/dto/chat";
import { useState } from "react";
import { JSX } from "react/jsx-runtime";
import { shopping } from "./_lib/shopping";

export default function Home(): JSX.Element {
  const [chats, setChats] = useState<Chat[]>([]);

  return (
    <main>
      {chats.map((chat, i) => (
        <p className="" key={i}>
          {chat.content}
        </p>
      ))}

      <button
        type="button"
        onClick={() => shopping((chat) => setChats((prev) => [...prev, chat]))}
        className="w-full cursor-pointer rounded-md bg-neutral-900 py-2.5 text-sm text-white hover:bg-neutral-700"
      >
        장바구니 확인하기
      </button>
    </main>
  );
}
