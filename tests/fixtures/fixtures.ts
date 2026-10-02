/**
 * DUY NHẤT 1 file fixture — mọi spec trong tests/specs/ VÀ mọi spec sinh ra dưới
 * cases/<slug>/browser/*.spec.ts đều import `test`/`expect`/`recordIO` từ đây
 * (KHÔNG import thẳng '@playwright/test').
 *
 * Khác 1 chỗ so với bộ POM cũ (tests-pom-optimized): fixture ở đây KHÔNG tự dựng sẵn
 * page object cho từng target, vì 1 test thường cần dùng CHUNG 1 page cho nhiều "lens"
 * khác nhau (vd: điền option trên PDP rồi add to cart rồi verify mini-cart — cả 3 thao
 * tác trên CÙNG 1 tab). Nếu inject sẵn `storefrontOptionWidgetPage` VÀ `storefrontCartPage`
 * là 2 fixture riêng, mỗi cái sẽ tự mở 1 tab mới (theo cơ chế `openTarget` bên dưới) —
 * sai hoàn toàn ý đồ.
 *
 * Cách dùng đúng trong spec:
 *   const page = await openTarget("storefront");       // 1 tab, đúng target khai trong e2e.config.yaml
 *   const widget = new StorefrontOptionWidgetPage(page); // "lens" 1: thao tác option trên PDP
 *   const cart = new StorefrontCartPage(page);           // "lens" 2: verify mini-cart — CÙNG page ở trên
 */
export { test, expect, recordIO } from "../../src/browser-fixture";
export type { Page, FrameLocator, Locator, BrowserContext } from "../../src/browser-fixture";
