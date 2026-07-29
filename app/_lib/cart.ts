import { Product } from "@/app/_dto/product";

const EXTENSION_ID = "kfdpecnbgglcnecdipkdebjbodblkebi";

// 상품 가격은 "8,900원" 형태의 문자열이라 숫자만 남겨 합산한다
export const getTotalPrice = (products: Product[]): string => {
  const total = products.reduce(
    (sum, product) => sum + Number(product.price.replace(/[^0-9]/g, "")),
    0,
  );
  return `${total.toLocaleString("ko-KR")}원`;
};

type OpenCartResponse = { ok: true } | { ok: false; error?: string };

// 확장 프로그램이 global_sid 쿠키를 주입한 뒤 장바구니 페이지를 연다
export const openCart = (globalSid: string): void => {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    alert("크롬 브라우저에서만 사용할 수 있습니다.");
    return;
  }

  chrome.runtime.sendMessage(
    EXTENSION_ID,
    { action: "openCart", value: globalSid },
    (response: OpenCartResponse) => {
      if (chrome.runtime.lastError) {
        alert("크롬 익스텐션이 설치되어 있지 않거나 응답이 없습니다.");
      } else if (!response.ok) {
        alert(`실패: ${response.error ?? "알 수 없는 오류"}`);
      }
    },
  );
};
