import { Page, expect, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { StorefrontCartLocators } from "../locators/storefront-cart.locators";

/**
 * StorefrontCartPage — hành động/assertion cho mini-cart/cart page.
 * ⚠️ Nhắc lại gotcha quan trọng nhất (chi tiết xem storefront-cart.locators.ts và project-notes.md):
 * cấu trúc mini-cart PHỤ THUỘC THEME. Page object này cố tình chỉ thao tác trên `[class*='bss-po-*']`
 * — phần do chính app OPTIS chèn vào, không đổi theo theme — để giảm rủi ro flaky khi đổi store/theme.
 */
export class StorefrontCartPage extends BasePage {
  readonly locators: StorefrontCartLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new StorefrontCartLocators(page);
  }

  async openMiniCart() {
    await this.locators.cartIcon.click();
  }

  async gotoCartPage() {
    await this.page.goto("/cart");
    await this.waitForPageLoad();
  }

  getLineByOptionText(optionText: string): Locator {
    return this.locators.lineByOptionText(optionText);
  }

  async verifyLineVisible(optionText: string) {
    await expect(this.locators.lineByOptionText(optionText)).toBeVisible();
  }

  async verifyCartTotal(expectedText: string) {
    await expect(this.locators.cartTotalPrice()).toContainText(expectedText);
  }

  async verifyLineFinalPrice(optionText: string, expectedText: string) {
    const line = this.locators.lineByOptionText(optionText);
    await expect(this.locators.lineFinalPrice(line)).toContainText(expectedText);
  }

  async clickBuyItNow() {
    await this.locators.buyItNowButton.click();
  }

  async applyDiscountCode(code: string) {
    await this.locators.discountCodeInput.fill(code);
    await this.locators.discountCodeApplyButton.click();
  }
}
