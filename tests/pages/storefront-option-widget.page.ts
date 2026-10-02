import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { StorefrontOptionWidgetLocators } from "../locators/storefront-option-widget.locators";

/**
 * StorefrontOptionWidgetPage — hành động/assertion cho widget option trên PDP storefront.
 * Map trực tiếp: storefront-rebuild-qa/05-option-type-settings/00-option-type-common-behavior.md
 */
export class StorefrontOptionWidgetPage extends BasePage {
  readonly locators: StorefrontOptionWidgetLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new StorefrontOptionWidgetLocators(page);
  }

  async gotoProduct(handle: string) {
    await this.page.goto(`/products/${handle}`);
    await this.waitForPageLoad();
  }

  // ----- AC-OPTTYPE-001/002: label -----
  async verifyOptionLabelVisible(optionName: string) {
    await expect(this.locators.optionLabelByName(optionName)).toBeVisible();
  }

  // ----- AC-OPTTYPE-003/004: Required -----
  async verifyRequiredMarkVisible(optionName: string, shouldShow: boolean) {
    const mark = this.locators.requiredMarkByOptionName(optionName);
    if (shouldShow) await expect(mark).toBeVisible();
    else await expect(mark).toHaveCount(0);
  }

  // ----- Điền / xoá giá trị -----
  async fillOption(optionName: string, value: string) {
    await this.locators.textInputByOptionName(optionName).fill(value);
  }

  async clearOption(optionName: string) {
    await this.locators.textInputByOptionName(optionName).fill("");
  }

  async verifyOptionValue(optionName: string, expected: string) {
    await expect(this.locators.textInputByOptionName(optionName)).toHaveValue(expected);
  }

  // ----- Help text -----
  async verifyHelpTextTooltip(optionName: string, expectedContent: string) {
    await expect(this.locators.helpTextTooltipIcon(optionName)).toBeVisible();
    await expect(this.locators.helpTextTooltipContent(optionName)).toBeHidden();
    await this.locators.helpTextTooltipWrapper(optionName).hover();
    await expect(this.locators.helpTextTooltipContent(optionName)).toBeVisible();
    await expect(this.locators.helpTextTooltipContent(optionName)).toHaveText(expectedContent);
  }

  async verifyHelpTextBesideTitle(optionName: string, expectedContent: string) {
    await expect(this.locators.helpTextBesideTitle(optionName)).toBeVisible();
    await expect(this.locators.helpTextBesideTitle(optionName)).toHaveText(expectedContent);
  }

  async verifyHelpTextBelowTitle(optionName: string, expectedContent: string) {
    await expect(this.locators.helpTextBelowTitle(optionName)).toBeVisible();
    await expect(this.locators.helpTextBelowTitle(optionName)).toHaveText(expectedContent);
  }

  async verifyHelpTextBelowOption(optionName: string, expectedContent: string) {
    await expect(this.locators.helpTextBelowOption(optionName)).toBeVisible();
    await expect(this.locators.helpTextBelowOption(optionName)).toHaveText(expectedContent);
  }

  // ----- Validation error khi Add to cart bị chặn -----
  async verifyValidationErrorShown(expectedTextContains?: string) {
    await expect(this.locators.validationErrorMessage).toBeVisible();
    if (expectedTextContains) await expect(this.locators.validationErrorMessage).toContainText(expectedTextContains);
  }
}
