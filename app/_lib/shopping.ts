import { Chat } from "@/app/_dto/chat";
import { Product } from "@/app/_dto/product";
import { getIngredients, recommendDish, selectProduct } from "../_actions/llm";
import {
  closeBrowser,
  getCart,
  searchProducts,
} from "../_actions/lottemart-zetta";

type UnresolvedIngredient = {
  ingredient: string;
  failedIngredients: string[];
};

const recommendedDishes: string[] = [];
const failedDishes: string[] = [];

export const shopping = async (
  userInput: string,
  addChat: (chat: Chat) => void,
): Promise<string> => {
  addChat({ role: "user", content: userInput });

  let globalSid = "";
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
      const nextUnresolvedIngredients: UnresolvedIngredient[] = [];

      // 재료 하나씩 검색과 상품 선택을 순차 수행
      for (const { ingredient, failedIngredients } of unresolvedIngredients) {
        addChat({ role: "agent", content: `${ingredient} 검색 중...` });

        const candidateProducts = await searchProducts(ingredient);
        const selectProductResponse = await selectProduct(
          recommendDishResponse.dish,
          ingredient,
          candidateProducts,
          failedIngredients,
        );

        if (selectProductResponse.action === "select") {
          const product = candidateProducts.find(
            (candidateProduct) =>
              candidateProduct.id === selectProductResponse.id,
          );
          if (product) {
            selectedProducts.push(product);
            addChat({
              role: "agent",
              content: selectProductResponse.response,
            });
            continue;
          }
        }

        if (selectProductResponse.action === "replace") {
          nextUnresolvedIngredients.push({
            ingredient: selectProductResponse.ingredient,
            failedIngredients: [...failedIngredients, ingredient],
          });
          addChat({
            role: "agent",
            content: selectProductResponse.response,
          });
          continue;
        }

        isDishFailed = true;
        addChat({
          role: "agent",
          content: selectProductResponse.response,
        });
        break;
      }

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
    globalSid = await getCart(selectedProducts);
    addChat({ role: "agent", content: `장바구니에 다 담았어요! ${globalSid}` });
    break;
  }

  await closeBrowser();

  return globalSid;
};
