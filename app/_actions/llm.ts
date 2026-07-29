"use server";

import { GetIngredientsResponse } from "@/app/_dto/get-ingredients-response";
import { Product } from "@/app/_dto/product";
import { RecommendDishResponse } from "@/app/_dto/recommend-dish-response";
import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { SelectProductResponse } from "../_dto/select-product-response";

const model = google("gemini-3.1-flash-lite");
// const model = google("gemini-3.5-flash");

export const recommendDish = async (
  userInput: string,
  recommendedDishes: string[],
  failedDishes: string[],
): Promise<RecommendDishResponse> => {
  const instructions = [
    "너는 사용자가 먹고 싶은 것을 파악해 요리 하나를 추천하는 요리 추천 장인이다.",
    "사용자 입력에 대해 무슨 일이 있어도 반드시 한개의 요리를 추천해라.",
    "요리는 반드시 마트에서 재료를 사다 집에서 만들 수 있는 것이어야 한다.",
  ].join("\n");

  const prompt = [
    `사용자 입력: ${userInput}`,
    recommendedDishes.length > 0 &&
      `다음 요리들은 이전에 이미 추천했으니 제외해라: ${recommendedDishes.join(", ")}. 단, 제외한다는 사실은 응답에서 언급하거나 암시하지 말고, 처음 추천하는 것처럼 응답해라.`,
    failedDishes.length > 0 &&
      `다음 요리들은 재료를 구하지 못하니 제외해라: ${failedDishes.join(", ")}. 직전에 ${failedDishes[failedDishes.length - 1]}을(를) 추천했지만 네가 마트에서 재료 상품을 찾지 못했다. 이번 응답에는 네가 재료를 찾지 못해서 다른 요리를 추천한다는 내용이 자연스럽게 들어가야 한다.`,
  ]
    .filter(Boolean)
    .join("\n");

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        dish: z.string().describe("추천하는 요리 이름"),
        response: z
          .string()
          .describe(
            "사용자 입력에 대한 자연스러운 대화체 응답. 추천하는 요리 이름과 추천 이유가 응답 안에 자연스럽게 녹아 있어야 한다",
          ),
      }),
    }),
    instructions,
    prompt,
  });

  return output;
};

export const getIngredients = async (
  dish: string,
): Promise<GetIngredientsResponse> => {
  const instructions = [
    "너는 주어진 요리를 만들기 위해 마트에서 사야 할 재료를 정리해주는 요리 재료 선정 장인이다.",
    "주어진 요리를 만드는 데 필요한 재료를 나열해라.",
    "각 재료는 네가 마트 검색창에 입력할 검색어로 쓰이므로 수식어 없는 일반적인 상품명으로 써라. (예: '신선한 국내산 돼지고기' 대신 '돼지고기')",
    "중복되는 재료를 넣지 말고, 마트에서 살 수 있는 재료만 나열해라.",
  ].join("\n");

  const prompt = `요리: ${dish}`;

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        ingredients: z.array(z.string()).describe("요리에 필요한 재료 목록"),
        response: z
          .string()
          .describe(
            "사용자에게 보여줄 자연스러운 대화체 응답. 어떤 재료가 필요한지와 이제 그 재료들을 네가 마트에서 찾아보겠다는 내용이 자연스럽게 녹아 있어야 한다",
          ),
      }),
    }),
    instructions,
    prompt,
  });

  return output;
};

export const selectProduct = async (
  dish: string,
  ingredient: string,
  products: Product[],
  failedIngredients: string[],
): Promise<SelectProductResponse> => {
  const instructions = [
    "너는 요리에 넣을 재료로 쓸 상품을 마트 검색 결과에서 고르는 상품 선택 장인이다.",
    "각 상품은 id(id), 이름(name), 리뷰 개수(reviewCount), 리뷰 평점(averageReviewScore), 가격(price), 단위당 가격(pricePerQuantity) 정보를 가진다.",
    "상품들의 이름, 리뷰 개수, 리뷰 평점, 가격, 단위당 가격을 모두 고려해서 다음의 판단 기준에 따라 action을 취해라.",
    "판단 기준:",
    "- 적당한 상품이 있으면 action: select, id에 해당 상품의 id를 담아라.",
    "- 적당한 상품이 없지만 주어진 재료 대신에 요리에 사용할 수 있는 다른 재료가 있으면 action: replace, ingredient에 대체 재료를 담아라. 대체 재료는 네가 마트 검색창에 입력할 검색어로 쓰이므로 수식어 없는 일반적인 상품명으로 써라. (예: '신선한 국내산 돼지고기' 대신 '돼지고기')",
    "- 대체 재료도 마땅치 않으면 action: fail",
  ].join("\n");

  const prompt = [
    `요리: ${dish}`,
    `재료: ${ingredient}`,
    `상품 리스트: ${JSON.stringify(products)}`,
    failedIngredients.length > 0 &&
      `다음 재료들은 이미 시도했던 것들이니 대체 재료에서 제외해라: ${failedIngredients.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        action: z
          .enum(["select", "replace", "fail"])
          .describe("판단 기준에 따라 선택한 action"),
        id: z
          .string()
          .optional()
          .describe("action이 select일 때, 선택한 상품의 id"),
        ingredient: z
          .string()
          .optional()
          .describe("action이 replace일 때, 대체 재료"),
      }),
    }),
    instructions,
    prompt,
  });

  if (output.action === "select" && output.id) {
    return { action: "select", id: output.id };
  }
  if (output.action === "replace" && output.ingredient) {
    return { action: "replace", ingredient: output.ingredient };
  }
  return { action: "fail" };
};
