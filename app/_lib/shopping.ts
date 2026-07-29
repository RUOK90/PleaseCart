import { Chat } from "@/app/_dto/chat";
import { Product } from "@/app/_dto/product";
import {
  batchSelectProduct,
  getIngredients,
  recommendDish,
} from "../_actions/llm";
import { batchSearchProducts, getCart } from "../_actions/lottemart-zetta";

type UnresolvedIngredient = {
  ingredient: string;
  failedIngredients: string[];
};

const recommendedDishes: string[] = [];
const failedDishes: string[] = [];

export const shopping = async (
  userInput: string,
  addChat: (chat: Chat) => void,
): Promise<string | null> => {
  addChat({ role: "user", content: userInput });

  for (let dishAttempt = 0; dishAttempt < 3; dishAttempt++) {
    // 요리 결정
    const recommendDishResponse = await recommendDish(
      userInput,
      recommendedDishes,
      failedDishes,
    );
    recommendedDishes.push(recommendDishResponse.dish);
    addChat({ role: "agent", content: recommendDishResponse.response });

    // 재료 결정
    const getIngredientsResponse = await getIngredients(
      recommendDishResponse.dish,
    );
    addChat({ role: "agent", content: getIngredientsResponse.response });

    // 아직 상품 선택이 완료되지 못한 재료들
    let unresolvedIngredients: UnresolvedIngredient[] =
      getIngredientsResponse.ingredients.map((ingredient) => ({
        ingredient,
        failedIngredients: [],
      }));

    let isDishFailed = false;
    const selectedProducts: Product[] = [];
    for (
      let productAttempt = 0;
      productAttempt < 3 && unresolvedIngredients.length > 0;
      productAttempt++
    ) {
      addChat({
        role: "agent",
        content: `${unresolvedIngredients.map((unresolvedIngredient) => unresolvedIngredient.ingredient).join(", ")} 검색 중...`,
      });

      // 재료에 대한 상품 검색 병렬 수행
      const candidateProducts = await batchSearchProducts(
        unresolvedIngredients.map(
          (unresolvedIngredient) => unresolvedIngredient.ingredient,
        ),
      );

      // 검색된 상품들에서 적합한 상품 선택 병렬 수행
      const selectProductResponses = await batchSelectProduct(
        recommendDishResponse.dish,
        unresolvedIngredients.map((unresolvedIngredient, i) => ({
          ...unresolvedIngredient,
          products: candidateProducts[i],
        })),
      );

      const nextUnresolvedIngredients: UnresolvedIngredient[] = [];

      // 상품 선택 결과를 채팅에 반영
      selectProductResponses.forEach((selectProductResponse, i) => {
        if (isDishFailed) return;

        if (selectProductResponse.action === "select") {
          const product = candidateProducts[i].find(
            (candidateProduct) =>
              candidateProduct.id === selectProductResponse.id,
          );
          if (product) {
            selectedProducts.push(product);
            addChat({
              role: "agent",
              content: selectProductResponse.response,
            });
            return;
          }
        }

        if (selectProductResponse.action === "replace") {
          nextUnresolvedIngredients.push({
            ingredient: selectProductResponse.ingredient,
            failedIngredients: [
              ...unresolvedIngredients[i].failedIngredients,
              unresolvedIngredients[i].ingredient,
            ],
          });
          addChat({
            role: "agent",
            content: selectProductResponse.response,
          });
          return;
        }

        isDishFailed = true;
        addChat({
          role: "agent",
          content: selectProductResponse.response,
        });
      });

      if (isDishFailed) break;

      unresolvedIngredients = nextUnresolvedIngredients;
    }

    // 상품을 찾지 못한 재료가 하나라도 있을 경우 다른 요리 추천
    if (isDishFailed || unresolvedIngredients.length > 0) {
      failedDishes.push(recommendDishResponse.dish);
      continue;
    }

    // 선택된 상품 장바구니에 담기
    addChat({ role: "agent", content: "장바구니에 담는 중..." });
    const globalSid = await getCart(selectedProducts);
    addChat({ role: "agent", content: `장바구니에 다 담았어요! ${globalSid}` });
    return globalSid;
  }

  addChat({
    role: "agent",
    content: "죄송해요, 재료를 구할 수 있는 요리를 찾지 못했어요",
  });

  return null;
};
