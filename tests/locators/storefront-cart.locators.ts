import { Page, Locator } from "@playwright/test";

/**
 * StorefrontCartLocators — selector cho mini-cart / cart page / checkout review.
 *
 * ✅ CONFIRMED — tần suất xuất hiện thật trong PO/tae/src (grep 2026-09-14), xếp theo độ tin cậy
 * (số lần xuất hiện càng nhiều, càng là điểm neo trung tâm của nhiều module, càng ít khả năng đổi):
 *   bss-po-line-properties (11) · bss-po-mini-cart (4) · bss-po-cart-total-price (6) ·
 *   bss-po-item-final-price (6) · bss-po-product-price (5) · bss-po-btn-buyitnow (12) ·
 *   bss-po-cart-file (6) · bss-po-discount-code-* (nhiều biến thể, dùng `[class*="bss-po-discount-code"]`).
 *
 * ⚠️ GOTCHA quan trọng nhất của file này — đọc trước khi viết case mini-cart:
 * `modules/cart/handle-mini-cart.js` rẽ theo ĐÚNG 1 trong 4 nhánh tuỳ theme đang cài, KHÔNG cố định:
 *   1. Theme có section "cart-drawer" + "cart-notification-product" + "cart-icon-bubble" (kiểu Dawn)
 *   2. Theme có section "mini-cart" riêng
 *   3. Theme có section "bss-po-mini-cart" (app tự viết section, thường theme cũ/custom)
 *   4. Theme có section "api__minicart"
 * → CHỈ đúng 1 nhánh chạy tuỳ theme của store đang test. Test container ngoài (`#CartDrawer`,
 * `.mini-cart`...) SẼ FLAKY nếu đổi store/đổi theme. Ưu tiên assert trên nội dung `bss-po-*` bên
 * trong (giá, SKU, line property) — các class này KHÔNG đổi theo nhánh nào được chọn, vì App tự
 * chèn chúng vào bất kỳ HTML nào theme trả về.
 */
export class StorefrontCartLocators {
  constructor(private page: Page) {}

  // ----- Icon giỏ hàng / mở mini-cart (selector container — xem gotcha ở trên, có thể cần đổi theo theme) -----
  get cartIcon(): Locator {
    return this.page.locator('a[href="/cart"], .header__cart-toggle, [data-cart-icon]');
  }

  // ----- Nội dung dòng hàng — ổn định qua mọi theme vì do app tự chèn -----
  /** 1 dòng cart line — tìm theo attribute `bss-po-line-properties` chứa tên option đã chọn. */
  lineByOptionText(optionText: string): Locator {
    return this.page.locator("[class*='bss-po-line-properties']", { hasText: optionText });
  }

  get allCartLines(): Locator {
    return this.page.locator("[class*='bss-po-line-properties']");
  }

  cartTotalPrice(): Locator {
    return this.page.locator("[class*='bss-po-cart-total-price']");
  }

  lineFinalPrice(line: Locator): Locator {
    return line.locator("[class*='bss-po-item-final-price'], [class*='bss-po-final-line-price']");
  }

  lineOriginalPrice(line: Locator): Locator {
    return line.locator("[class*='bss-po-item-original-price'], [class*='bss-po-original-line-price']");
  }

  // ----- Buy it now -----
  get buyItNowButton(): Locator {
    return this.page.locator("[class*='bss-po-btn-buyitnow']");
  }

  // ----- File upload trong cart -----
  cartFileLink(line: Locator): Locator {
    return line.locator("[class*='bss-po-cart-file']");
  }

  // ----- Discount code (nhiều biến thể class, dùng contains) -----
  get discountCodeInput(): Locator {
    return this.page.locator("[class*='bss-po-discount-code-input']").locator("input");
  }
  get discountCodeApplyButton(): Locator {
    return this.page.locator("[class*='bss-po-discount-code-input--button']");
  }
  get discountCodeAppliedMessage(): Locator {
    return this.page.locator("[class*='bss-po-discount-code--message']");
  }
}
