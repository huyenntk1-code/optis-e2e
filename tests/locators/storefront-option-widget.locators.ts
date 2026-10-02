import { Page, Locator } from "@playwright/test";

/**
 * StorefrontOptionWidgetLocators — selector cho widget option trên PDP storefront.
 *
 * ✅ CONFIRMED từ source thật (PO/tae/src, đọc 2026-09-14) — không phải đoán:
 *   - KHÔNG có iframe, KHÔNG có Shadow DOM (BssLitElement override `createRenderRoot` về light DOM).
 *     → dùng `page.locator()` thẳng, không cần frameLocator/shadow-piercing.
 *   - KHÔNG có `data-testid` nào trong toàn bộ code storefront (grep xác nhận = 0 kết quả).
 *   - Class thật lấy từ modules/option-set/renderers/TextBoxRenderer.js (đại diện — các renderer
 *     khác theo cùng pattern: po-label-container / po-label / po-option--container).
 *   - Dấu required: `<span class="po-required">*</span>` — xác nhận từ option-set.js:600 và
 *     handle-cart-edit-option.js:473 (2 nơi độc lập, cùng 1 class → đáng tin cậy cao).
 *   - ID có hậu tố SỐ ĐỘNG theo `option.id` (vd `po_text_box42`) — KHÔNG BAO GIỜ hardcode số này
 *     trong test, vì số khác nhau giữa các option set/môi trường. Dùng `[id^="po_text_box"]` hoặc
 *     match theo label/cấu trúc cha.
 *
 * ✅ CONFIRMED — Help text (đọc source `option-set.js:601-603` + `TextBoxRenderer.js` + `bss-po-style.css`,
 *   2026-09-21, xem `PO/tae`): mỗi option chỉ có 1 trong 2 khối, tuỳ `help_text_type`/`help_text_position`:
 *   - Tooltip (`type=0`): `<div class="po-helptext-tooltip"><i class="fa-info-custom"></i>
 *     <span class="tooltip-text ...">{content}</span></div>` — nằm NGAY TRONG `.po-label`, cạnh label text.
 *     Icon không có text/aria-label (thuần CSS background-image) — chỉ assert bằng class. Tooltip hiện khi
 *     hover là CSS `:hover` thuần, KHÔNG phải native `title`, KHÔNG có `aria-describedby`/`role="tooltip"`.
 *   - Inline (`type=1`): `<div class="po-helptext-content"><p>{content}</p></div>` — vị trí tuỳ
 *     `help_text_position`: BESIDE_TITLE(1) → nằm trong `.po-label` (cùng cấp `.po-helptext-tooltip` ở trên);
 *     BELOW_TITLE(0) → div anh em nằm NGAY SAU `.po-label-container` (trước `.po-option--container`);
 *     BELOW_OPTION(2) → div anh em nằm NGAY SAU `.po-option--container`.
 *   - Help text rỗng → không render gì cả (cả 2 khối đều bị bỏ qua), ở mọi vị trí.
 *
 * ⚠️ CHƯA CONFIRM (đánh dấu rõ, đừng tin tuyệt đối trước khi probe):
 *   - Text nguyên văn của thông báo lỗi validation (nằm trong Settings > Translation, giá trị
 *     default đọc từ `BSS_PO.settings.translations.*` — cần đọc runtime hoặc DevTools 1 lần).
 */
export class StorefrontOptionWidgetLocators {
  constructor(private page: Page) {}

  // ----- Label + input cho 1 option, match theo TEXT hiển thị (ổn định hơn ID số động) -----
  /** Label wrapper — chứa cả text option name lẫn dấu * nếu required. */
  labelContainerByOptionName(optionName: string): Locator {
    return this.page.locator(".po-label-container", { hasText: optionName });
  }

  optionLabelByName(optionName: string): Locator {
    return this.labelContainerByOptionName(optionName).locator(".po-label");
  }

  /** Dấu * required — nằm NGAY TRONG .po-label, không phải element riêng biệt kế bên. */
  requiredMarkByOptionName(optionName: string): Locator {
    return this.optionLabelByName(optionName).locator(".po-required");
  }

  /**
   * Input text box. Ưu tiên `getByLabel` — HTML thật có `<label for="po_text_box{id}">` +
   * `<input id="po_text_box{id}">` link đúng chuẩn a11y (xem TextBoxRenderer.getHtml()), nên
   * Playwright tự nối 2 element qua for/id mà KHÔNG cần biết số động đứng sau. Đây là selector
   * bền nhất trong file này — không phụ thuộc class/cấu trúc DOM, chỉ phụ thuộc label thật hiển
   * thị cho khách, đúng đề xuất "role/label trước, CSS sau cùng" của team.
   * (`.po-label-container` và `.po-option--container` là 2 <div> ANH EM, không lồng nhau — nếu
   * getByLabel không khớp vì text label bị pha thêm nội dung help-text/required, dùng cách 2 bên dưới.)
   */
  textInputByOptionName(optionName: string): Locator {
    return this.page.getByLabel(optionName);
  }

  /** Fallback khi getByLabel không match sạch (label lẫn quá nhiều text phụ) — đi qua cấu trúc DOM thật. */
  textInputByOptionNameFallback(optionName: string): Locator {
    return this.labelContainerByOptionName(optionName)
      .locator("xpath=following-sibling::div[contains(@class,'po-option--container')][1]")
      .locator("input.po-option--type-text");
  }

  // ----- Help text (Tooltip / Below the option title / Beside the option title / Below the option) -----
  /** Tooltip: icon "!" cạnh label — nằm trong .po-label, không có text/aria-label. */
  helpTextTooltipIcon(optionName: string): Locator {
    return this.optionLabelByName(optionName).locator(".po-helptext-tooltip .fa-info-custom");
  }

  /** Wrapper tooltip — dùng để `.hover()` (icon quá nhỏ, hover cả wrapper cho chắc). */
  helpTextTooltipWrapper(optionName: string): Locator {
    return this.optionLabelByName(optionName).locator(".po-helptext-tooltip");
  }

  /** Nội dung hiện khi hover — CSS hover thuần, không phải native title. */
  helpTextTooltipContent(optionName: string): Locator {
    return this.optionLabelByName(optionName).locator(".po-helptext-tooltip .tooltip-text");
  }

  /** Vị trí "Beside the option title" — nằm trong .po-label, cùng cấp icon tooltip ở trên. */
  helpTextBesideTitle(optionName: string): Locator {
    return this.optionLabelByName(optionName).locator(".po-helptext-content p");
  }

  /** Vị trí "Below the option title" — div anh em ngay sau .po-label-container. */
  helpTextBelowTitle(optionName: string): Locator {
    return this.labelContainerByOptionName(optionName)
      .locator("xpath=following-sibling::div[contains(@class,'po-helptext-content')][1]")
      .locator("p");
  }

  /** Vị trí "Below the option" — div anh em ngay sau .po-option--container. */
  helpTextBelowOption(optionName: string): Locator {
    return this.labelContainerByOptionName(optionName)
      .locator("xpath=following-sibling::div[contains(@class,'po-option--container')][1]")
      .locator("xpath=following-sibling::div[contains(@class,'po-helptext-content')][1]")
      .locator("p");
  }

  // ----- Container tổng (dùng khi cần quét toàn bộ widget, ví dụ đếm số option) -----
  get allOptionLabels(): Locator {
    return this.page.locator(".po-label");
  }

  // ----- Validation / lỗi khi Add to cart bị chặn -----
  // ⚠️ Chưa xác nhận class thật — best-effort, verify bằng `pnpm e2e:probe` trước khi dùng thật.
  get validationErrorMessage(): Locator {
    return this.page.locator(".po-error-message, [class*='po-error']");
  }

  // ----- Conditional Logic: option bị ẩn/hiện theo điều kiện -----
  // Cơ chế ẩn/hiện thật (CSS display:none hay gỡ khỏi DOM) CHƯA xác nhận — cả 2 cách đều hợp lệ với
  // Playwright `toBeVisible()`/`toBeHidden()`, không cần biết cơ chế cụ thể để viết assertion đúng.
}
