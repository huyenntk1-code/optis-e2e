import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { CmsOptionSetLocators } from "../locators/cms-option-set.locators";

/**
 * CmsOptionSetPage — hành động phía admin (CMS) khi cần setup QUA UI (thay vì API).
 * Ưu tiên dùng API (xem tests/services/option-set.api.ts + cases/*/cases.yaml phase:setup) khi có
 * thể — chỉ dùng Page Object này khi bản thân UI admin là thứ đang cần kiểm tra (vd AC-DESIGN-*,
 * AC-GENSET-*), theo đúng "automation ladder" đã học từ e2e-main.
 */
export class CmsOptionSetPage extends BasePage {
  readonly locators: CmsOptionSetLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new CmsOptionSetLocators(page);
  }

  async gotoOptionSets(storeHandle: string, appHandle: string) {
    await this.page.goto(`https://admin.shopify.com/store/${storeHandle}/apps/${appHandle}/option-sets`);
    await this.locators.appFrame.locator("body").waitFor({ state: "visible", timeout: 20_000 });
  }

  async gotoOptionSetDetail(storeHandle: string, appHandle: string, optionSetId: string | number) {
    await this.page.goto(`https://admin.shopify.com/store/${storeHandle}/apps/${appHandle}/option-sets/${optionSetId}`);
    await this.locators.appFrame.locator("body").waitFor({ state: "visible", timeout: 20_000 });
  }

  async setRequired(checked: boolean) {
    const box = this.locators.requiredCheckbox();
    if ((await box.isChecked()) !== checked) await box.click();
  }

  async setNameOnProductPage(value: string) {
    await this.locators.onProductPageNameInput().fill(value);
  }

  async verifyPreviewShowsLabel(expectedLabel: string) {
    await expect(this.locators.previewPanel()).toContainText(expectedLabel);
  }

  async save() {
    await this.locators.saveButton().click();
  }
}
