"use server";

import { Product } from "@/app/_dto/product";
import { chromium, type Browser, type Page } from "playwright";

let browserPromise: Promise<Browser> | null = null;

export const getPage = async (
  userAgent: string = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
): Promise<Page> => {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true, channel: "chrome" });
  }
  const browser = await browserPromise;
  return await browser.newPage({ userAgent });
};

export const searchProducts = async (
  query: string,
  limit = 20,
): Promise<Product[]> => {
  const page = await getPage();

  await page.goto("https://lottemartzetta.com");

  // 검색창에 입력
  const searchInputLocator = page.locator("input#search");
  await searchInputLocator.fill(query);
  await searchInputLocator.press("Enter");

  // 검색 결과 페이지로 넘어갔는지 확인
  await page.waitForURL(/\/products\/search/, { timeout: 5000 });

  // 검색 결과 페이지 데이터 페치가 끝날 떄까지 대기
  await page.waitForTimeout(1000);

  const addToCartButtonsLocator = page.locator(
    `button[aria-label^="장바구니 담기"]`,
  );

  // 페이지 내의 상품 정보 수집
  const products = new Map<string, Product>();
  let emptyScrollCount = 0;
  for (let scrollCount = 0; scrollCount < 10; scrollCount++) {
    const productsSizeBeforeScroll = products.size;
    const addToCartButtons = await addToCartButtonsLocator.all();
    for (const addToCartButton of addToCartButtons) {
      try {
        // 상품명
        const name =
          (await addToCartButton.getAttribute("aria-label"))
            ?.replace(/^장바구니 담기\s*-?\s*/, "")
            ?.trim() ?? "";
        if (!name || products.has(name)) continue;

        // 상품 id, 상품 정보 텍스트
        const { id, productCardText } = await addToCartButton.evaluate(
          (element) => {
            const card = element.closest(
              ".product-card-container",
            ) as HTMLElement;
            const href = card
              .querySelector("a[href*='/products/']")!
              .getAttribute("href")!;
            return {
              id: href.match(/\/products\/([^/]+)\/details/)![1],
              productCardText: card.innerText,
            };
          },
        );
        const productCardLines = productCardText
          .split("\n")
          .map((line) => line.trim());

        // 리뷰
        const review = productCardLines
          .find((line) => line.startsWith("평점 5점 만점에"))!
          .match(/^평점 5점 만점에 ([\d.]+), 리뷰 (\d+)개$/);
        const averageReviewScore = review ? Number(review[1]) : 0;
        const reviewCount = review ? Number(review[2]) : 0;

        // 단위당 가격
        const pricePerQuantity = productCardLines
          .find((line) => /^\(.*당\s*[\d,]+원\)$/.test(line))!
          .slice(1, -1);

        // 총 가격
        const priceIndex = productCardLines.indexOf("가격") + 1;
        const price = productCardLines[priceIndex];

        products.set(name, {
          id,
          name,
          averageReviewScore,
          reviewCount,
          pricePerQuantity,
          price,
        });

        if (products.size >= limit) break;
      } catch {
        continue;
      }
    }

    if (products.size >= limit) break;

    // 스크롤을 통한 새로운 상품이 없으면 중단
    emptyScrollCount =
      products.size === productsSizeBeforeScroll ? emptyScrollCount + 1 : 0;
    if (emptyScrollCount >= 3) break;

    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(1000);
  }

  await page.close();

  return [...products.values()];
};

export const getCart = async (products: Product[]): Promise<string> => {
  const page = await getPage();

  await page.goto("https://lottemartzetta.com");

  const searchInputLocator = page.locator("input#search");
  for (const product of products) {
    // 검색창에 상품 id 입력
    await searchInputLocator.fill(product.id);
    await searchInputLocator.press("Enter");

    // 검색 결과 페이지로 넘어갔는지 확인
    await page.waitForURL(/\/products\/search/, { timeout: 5000 });

    // 검색 결과 페이지 데이터 페치가 끝날 떄까지 대기
    await page.waitForTimeout(1000);

    // 장바구니 담기
    await page
      .locator(
        `button[aria-label^="장바구니 담기"][aria-label$="${product.name}"]`,
      )
      .first()
      .click();
  }

  // 마지막 상품이 확실이 담기게 하기 위한 대기
  await page.waitForTimeout(1000);

  const cookies = await page.context().cookies("https://lottemartzetta.com");
  const globalSid = cookies.find(
    (cookie) => cookie.name === "global_sid",
  )!.value;

  await page.close();

  return globalSid;
};

export const closeBrowser = async (): Promise<void> => {
  if (!browserPromise) return;
  const browser = await browserPromise;
  browserPromise = null;
  if (browser.isConnected()) await browser.close();
};
