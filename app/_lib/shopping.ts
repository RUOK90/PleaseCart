import { Chat } from "@/dto/chat";
import { getCart, searchProducts } from "../_actions/lottemart-zetta";

export const shopping = async (
  addChat: (chat: Chat) => void,
): Promise<string> => {
  addChat({ role: "agent", content: "계란 검색 중..." });
  const eggs = await searchProducts("계란");
  addChat({ role: "agent", content: `계란 ${eggs.length}개 찾음` });

  addChat({ role: "agent", content: "고추장 검색 중..." });
  const paste = await searchProducts("고추장");
  addChat({ role: "agent", content: `고추장 ${paste.length}개 찾음` });

  addChat({ role: "agent", content: "장바구니에 담는 중..." });
  const globalSid = await getCart([...eggs.slice(0, 3), ...paste.slice(0, 3)]);
  addChat({ role: "agent", content: `완료: ${globalSid}` });

  return globalSid;
};
