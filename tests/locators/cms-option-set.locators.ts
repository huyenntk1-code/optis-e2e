import { Page, Locator, FrameLocator } from "@playwright/test";

/**
 * CmsOptionSetLocators — selector cho phần admin (CMS) quản lý option set.
 *
 * ✅ CONFIRMED live (2026-09-11, admin.shopify.com/store/khanh-huyen-store/apps/product-options-by-bss):
 *   `document.querySelector('iframe[name="app-iframe"]')` tồn tại thật, cross-origin thật (browser
 *   chặn `contentDocument` — đúng dự đoán, không phải bug). Route con thật (đọc từ CMS source,
 *   PO/cms/app/routes/): `/app/option-sets` (listing), `/app/option-sets/:id` (detail/edit).
 *
 * ✅ CONFIRMED từ source (PO/cms/app/shared/components/ui/web-components/base/*.tsx):
 *   Component `S*` (SButton, SBadge, SBox, SClickable, SGrid, SIcon) dùng SHADOW DOM THẬT
 *   (`element.shadowRoot.querySelector(...)`). Lit mặc định `attachShadow({mode:'open'})` nên
 *   Playwright tự xuyên qua — `getByRole`/`getByText` qua `appFrame` vẫn hoạt động bình thường,
 *   KHÔNG cần cú pháp xuyên shadow thủ công. Nếu 1 ngày nào đó match sai/không match, thử thẳng
 *   `.locator('s-button .button')` (class thật bên trong shadow root) thay vì tin `getByRole`.
 *
 * ⚠️ CHƯA CONFIRM (cần recon 1 lần khi có phiên đăng nhập ổn định — xem SETUP.md):
 *   - Tên field/label thật cho "On product page", "This option is required", "Hide option name"...
 *     (đã biết ĐÚNG NGUYÊN VĂN label này từ bảng testcase gốc, nhưng chưa biết `data-testid`/id thật
 *     đứng sau — CMS cũng có 0 kết quả `data-testid` khi grep nhanh `app/features/option-set-detail`,
 *     nên nhiều khả năng cũng phải match theo `getByLabel`/`getByRole` như storefront).
 *   - `<SaveBar>` (nếu dùng Polaris `ContextualSaveBar`) render trong hay ngoài `app-iframe` — app
 *     khác (B2Bridge) từng phát hiện nó render NGOÀI iframe. Cần xác nhận riêng cho OPTIS, đừng suy
 *     diễn giống app khác.
 */
export class CmsOptionSetLocators {
  constructor(private page: Page) {}

  /** ✅ Confirmed tên thật, không cần fallback nữa. */
  get appFrame(): FrameLocator {
    return this.page.frameLocator('iframe[name="app-iframe"]');
  }

  // ----- Danh sách option set (/app/option-sets) -----
  createOptionSetButton(): Locator {
    return this.appFrame.getByRole("button", { name: /create option set|new option set/i });
  }

  optionSetRowByName(name: string): Locator {
    return this.appFrame.getByRole("row", { name });
  }

  // ----- Chi tiết option set (/app/option-sets/:id) -----
  onProductPageNameInput(): Locator {
    return this.appFrame.getByLabel("On product page");
  }

  onCartPageNameInput(): Locator {
    return this.appFrame.getByLabel("On cart page");
  }

  requiredCheckbox(): Locator {
    return this.appFrame.getByLabel("This option is required");
  }

  hideOptionNameCheckbox(): Locator {
    return this.appFrame.getByLabel("Hide option name");
  }

  saveButton(): Locator {
    // ⚠️ Nếu OPTIS cũng dùng Polaris SaveBar NGOÀI iframe (giống B2Bridge) — đổi locator này sang
    // this.page.getByRole(...) thay vì this.appFrame.getByRole(...) sau khi recon xác nhận.
    return this.appFrame.getByRole("button", { name: /^save$/i });
  }

  previewPanel(): Locator {
    return this.appFrame.locator("[class*='preview']").first();
  }

  // ----- Applied Product / Applied Customer (Targeting) -----
  productConditionTypeSelect(): Locator {
    return this.appFrame.getByLabel(/applied product|apply to.*product/i);
  }

  customerConditionTypeSelect(): Locator {
    return this.appFrame.getByLabel(/applied customer|apply to.*customer/i);
  }
}
