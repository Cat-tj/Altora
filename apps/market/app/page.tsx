import { getProduct } from "@altora/core/product-catalog";
import { MarketWorkspace } from "./market-workspace";

export default function MarketPage() {
  getProduct("market");

  return <MarketWorkspace />;
}
