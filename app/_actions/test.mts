import { Product } from "@/dto/product";
import { chromium } from "playwright";
import { getCart, searchProducts } from "./lottemart-zetta";

const browser = await chromium.launch({ headless: false, channel: "chrome" });
const queries = ["계란", "고추장", "제육"];
const products = await Promise.all(
  queries.map(async (query) => await searchProducts(browser, query)),
);

const cartProducts: Product[] = [];

queries.forEach((query, queryIdx) => {
  console.log(`쿼리: ${query}\n`);
  products[queryIdx].forEach((p, i) => {
    if (i < 3) cartProducts.push(p);
    console.log(`${i + 1}. ${p.name}`);
    console.log(`url: https://lottemartzetta.com/products/${p.id}/details`);
    console.log(`리뷰: ${p.averageReviewScore}점 ${p.reviewCount}개`);
    console.log(p.price);
    console.log(p.pricePerQuantity);
    console.log();
  });
  console.log();
});

const global_sid = await getCart(browser, cartProducts);

console.log(global_sid);

browser.close();
