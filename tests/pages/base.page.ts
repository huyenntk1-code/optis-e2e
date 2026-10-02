import { Page, expect } from "@playwright/test";

/**
 * BasePage: hàm dùng chung cho mọi Page Object trong tests/pages/.
 * Giữ nguyên từ bộ POM cũ (tests-pom-optimized/tests/pages/base.page.ts) — không đổi gì,
 * chỉ thêm chú thích cho rõ khi nào dùng hàm nào.
 */
export class BasePage {
  constructor(protected page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState("domcontentloaded");
    // Storefront OPTIS có polling/JS chạy nền (live preview canvas) — networkidle có thể không bao giờ
    // đạt được trên trang có canvas/animation liên tục. Không throw nếu timeout, chỉ tiếp tục.
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  async assertUrlContains(part: string) {
    await expect(this.page).toHaveURL(new RegExp(part));
  }
}
