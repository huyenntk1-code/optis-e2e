# Project notes — OPTIS Product Options

> Tri thức riêng cho app này (khác `_shared/core.md`, `_shared/references/*` — những file đó giữ nguyên khi đổi
> app). Nội dung dưới đây đến từ việc đọc trực tiếp source code thật ngày 2026-09-14
> (`PO/api`, `PO/cms`, `PO/tae`) + khảo sát live `khanh-huyen-store` — không phải suy đoán, trừ khi ghi rõ
> "⚠️ chưa xác nhận".

## Targets

Khai báo trong `e2e.config.yaml`: `api`, `cms` (app nhúng Shopify Admin), `storefront`, `storefront-2` (persona
khách thứ 2). Domain/secret **không ghi ở đây** — resolve từ `.env`.

| Target | Thực chất là gì | Đặc điểm phải nhớ |
|---|---|---|
| `api` | NestJS 11, port 4000 local, prefix `/api/v1` (trừ `life-check` sống ở root) | Auth `ShopifyEmbeddedGuard`, JWT HS256 |
| `cms` | React Router v7 + Polaris, nhúng Shopify Admin qua **iframe `app-iframe`** (đã xác nhận live 2026-09-11) | Xem "Locator gotchas" — Shadow DOM |
| `storefront` | Webpack bundle `bss-po-js.js` (+ `bss-po-live-preview.js`), tiêm thẳng vào DOM theme | **KHÔNG phải iframe** — xác nhận `grep -rl iframe PO/tae/src` ra rỗng |
| `storefront-2` | Cùng cơ chế, dùng persona khách thứ 2 (test Targeting theo customer, xem `02-targeting-applied-product-customer.md`) | |

## Kiến trúc 3 repo (để biết sửa/soi ở đâu khi case fail)

```
PO/api   — NestJS + Prisma + MariaDB. Modules chính: shop, option-set, webhooks, scheduler, media, plan.
PO/cms   — React Router v7 (Remix kế nhiệm) + Polaris + App Bridge React. Gọi API qua React Query, KHÔNG gọi
           API trực tiếp trong loader/component (trừ Shopify Admin GraphQL, chạy server-side).
PO/tae   — Vanilla JS + Lit (nhưng override light DOM, xem dưới) + Konva (canvas cho Live Preview).
           Global namespace `window.BSS_PO` — mọi state/handler storefront đều treo vào đây.
```

## ⚠️ Locator gotchas — đọc trước khi viết bất kỳ selector nào

### CMS (trong `app-iframe`)
- **`S*` web component (`SButton`, `SBadge`, `SBox`, `SClickable`, `SGrid`, `SIcon`...) dùng Shadow DOM THẬT**
  (`app/shared/components/ui/web-components/base/*.tsx`, mỗi file có `element.shadowRoot.querySelector(...)`).
  Lit mặc định `attachShadow({mode:'open'})` nên Playwright **tự xuyên qua được** — `getByRole`/`getByText` vẫn
  chạy bình thường qua `frameLocator(...)`. Nếu 1 selector không match dù đã đúng thứ tự `frameLocator` → nghi ngờ
  ARIA role của custom element không map đúng, thử `page.locator('s-button .button')` (class thật bên trong shadow
  root: `.button`, `.content`, `.text-wrapper`) thay vì `getByRole`.
- Chưa xác nhận `<SaveBar>` (nếu Polaris `ContextualSaveBar` được dùng) render trong hay ngoài iframe — app khác
  (B2Bridge) từng gặp case này render NGOÀI iframe (ở top-level Admin chrome). **Cần recon xác nhận riêng cho
  OPTIS**, đừng giả định giống B2Bridge.

### Storefront (KHÔNG phải iframe, KHÔNG phải Shadow DOM)
- `BssLitElement.createRenderRoot() { return this; }` (`modules/option-set/components/base/bss-lit-element.js`)
  — **ghi đè** hành vi Shadow DOM mặc định của Lit → mọi component storefront render ra **light DOM bình thường**.
  `page.locator()` dùng trực tiếp, không cần cú pháp xuyên shadow, không cần `frameLocator`.
- **Không có `data-testid` nào** trong toàn bộ `PO/tae/src` (đã grep, count = 0). Selector phải dựa vào class/id
  thật, chia 2 nhóm:
  - **`po-*`** — element thuộc widget option trên PDP (label, input, help text). ID có **hậu tố số động**
    theo `option.id` (vd `po_text_box${option.id}`, `po_label${option.id}`) — **KHÔNG hardcode số**, match theo
    prefix (`[id^="po_text_box"]`) hoặc theo text label hiển thị, hoặc theo cấu trúc cha (`.po-label-container`).
  - **`bss-po-*`** — element cross-cutting (cart line, giá, mini-cart, buy-it-now...), ổn định hơn vì không phụ
    thuộc theme. Ưu tiên assert trên nhóm này khi kiểm tra cart/checkout.
  - Dấu bắt buộc: `<span class="po-required">*</span>` — xác nhận nguyên văn từ
    `modules/option-set/option-set.js:600` và `modules/cart/handle-cart-edit-option.js:473`.
- **Mini-cart PHỤ THUỘC THEME** — `modules/cart/handle-mini-cart.js` rẽ **4 nhánh** khác nhau tuỳ section nào
  theme trả về: `cart-drawer` (Dawn-style), `mini-cart` (theme tuỳ biến), `bss-po-mini-cart` (theme tự viết section
  riêng cho app), `api__minicart`. **Đừng hardcode 1 cấu trúc mini-cart cho mọi test** — hoặc (a) recon riêng đúng
  theme của store đang test, hoặc (b) ưu tiên assert trên nội dung `bss-po-*` bên trong (giá, SKU, line property)
  thay vì assert cấu trúc container — nội dung đó không đổi theo nhánh nào được chọn.
- `BSS_PO.previewMode = window.self !== window.top` — code tự nhận biết đang chạy trong iframe preview (admin)
  hay standalone (storefront thật). Nếu case nào cần phân biệt 2 ngữ cảnh preview vs storefront, đọc biến này qua
  `page.evaluate(() => window.BSS_PO?.previewMode)`.

## Known state chains

⚠️ Danh sách khởi điểm — chỉ có route xác nhận từ controller thật, **CHƯA verify full request/response bằng cách
gọi thật** (cần key thật để làm, xem "Environment checks"). Bổ sung tiếp khi `/e2e analyze`/`/e2e data` chạy thật.

| Trạng thái cần | Chuỗi (route xác nhận từ `option-set.controller.ts`) |
|---|---|
| 1 option set tồn tại | `POST /api/v1/option-sets` (`CreateOptionSetDto`) |
| Option set có `required=1` cho 1 option | `GET /api/v1/option-sets/:id` (đọc full options[]) → sửa đúng phần tử `required: 1` trong mảng → `PATCH /api/v1/option-sets/:id` gửi lại **nguyên payload** (xem "Switchable settings" — nghi ngờ full-upsert) |
| Option set bị xoá | `option-sets` dùng soft delete (`deletedAt`, theo `CLAUDE.md` §Key Patterns) — DELETE thật là `bulk-delete`; scheduler tự hard-delete sau 30 ngày |
| Trạng thái publish/status đổi | `PUT /api/v1/option-sets/bulk-status` (`BulkUpdateStatusDto`) |
| Option set thành premium/template | `POST /api/v1/option-sets/:id/mark-as-premium`, `POST /api/v1/option-sets/save-as-templates` |
| Danh sách sản phẩm đang áp dụng 1 option set | `GET /api/v1/option-sets/:id/applied-products` — **route này trực tiếp phục vụ verify Targeting** (đối chiếu AC-TARGET-003/004/005) mà không cần mở từng PDP |

## Switchable settings

| Setting | Field DTO thật (`update-option-set.dto.ts`, `nested/update/option.input.dto.ts`) | Lưu ý |
|---|---|---|
| Required (1 option) | `required?: number` — **là số (0/1), KHÔNG phải boolean** `true/false` | Nằm trong mảng `options[]`/`groups[].options[]` lồng bên trong `UpdateOptionSetDto`, không phải field rời |
| Applied Customer | field DTO thật tên **`applyTo`** (kiểu `CUSTOMER_CONDITION_TYPE`) | ⚠️ **Khác tên** với `customerConditionType` từng ghi trong requirement kỹ thuật gốc (`02-targeting-applied-product-customer.md`) — khi viết case gọi API, dùng đúng `applyTo`, không dùng `customerConditionType`. Field đích cho product side (`productConditionType`) thì khớp đúng như requirement gốc, không đổi. |
| Applied Product | `productConditionType?: number`, kèm `productIds`/`productCollections`/`productTags`/`specificVariantIds` tuỳ giá trị — có `@RequiredWhen` (validator riêng) buộc field con bắt buộc đúng theo giá trị enum đã chọn | |
| Priority | `priority?: number`, `@Min(0) @Max(99)` | Khớp đúng range đã ghi trong AC-TARGET-008 |

> ⚠️ **Nghi vấn "full upsert, không phải patch từng phần"** — chưa xác nhận 100% (chưa đọc service layer), nhưng
> toàn bộ field trong `UpdateOptionSetDto` đều `@IsOptional()`, gợi ý nhiều khả năng đây thực sự là partial-patch
> hợp lệ (khác pattern "full upsert" đã thấy ở app B2Bridge). **Vẫn nên test 1 lần thật**: PATCH chỉ đúng 1 field
> `{ options: [{ id, required: 1 }] }`, GET lại xem các field khác (vd `productConditionType` đã set trước đó) có
> bị reset về default không — đây chính là setup step đầu tiên nên chạy trước khi tin tưởng viết case khác.

## Environment checks

- API health: `GET /life-check` (route root, loại khỏi global prefix theo `main.ts` — gọi thẳng
  `${API_BASE_URL}/life-check`, **không** kèm `/api/v1`).
- Swagger (chỉ bật khi `NODE_ENV != production`, xem `main.ts`) — nếu cần xem full schema DTO thật thay vì đọc
  code, mở `${API_BASE_URL}/api-docs` (đường dẫn Swagger UI thật cần xác nhận thêm, `main.ts` có
  `DocumentBuilder().setTitle('OPTIS Product Options API')` nhưng chưa đọc dòng `SwaggerModule.setup(...)` để biết
  chính xác path — recon nhanh 1 lần nếu cần).
- `pnpm e2e:doctor` gọi luôn 2 endpoint (`/life-check`, `/health/live`) — endpoint đầu đúng cho app này.

## Quy ước code của team (để spec/case sinh ra "giống người trong team viết", dễ review)

- **api**: Prettier — `singleQuote: true, semi: false, trailingComma: none, printWidth: 120`. Path alias `@/*`.
  Commit: `<type>(<scope>): <branch> - <subject>`.
- **cms**: React Router v7 file-based routes = **wrapper mỏng** (chỉ `authenticate.admin()` + render Page); mọi
  gọi API qua `service → hook (React Query)`, không gọi thẳng trong component. Barrel export bắt buộc (`index.ts`
  mỗi folder). Naming: hook `use-<name>.ts`, service `<feature>.api.ts`, component `PascalCase.tsx`.
- **tae**: ESLint riêng (`.eslintrc.js`), build qua webpack (`po.webpack.config.js`) ra
  `extensions/option-app-extensions/assets/bss-po-js.js` + `bss-po-live-preview.js`.
- **Chưa có test tự động nào** ở `cms` (README tự ghi "No test runner is configured"), `api` có Jest cấu hình
  nhưng chưa có script `test` chạy, `tae` có Jest cho phần Shopify Function Rust/WASM
  (`extensions/price-add-ons-rs`) nhưng không có test cho phần JS storefront chính. **`optis-e2e` này là lớp E2E
  đầu tiên của cả 3 repo** — không có test cũ để tham chiếu quy ước, mọi case mới tự thiết lập chuẩn.

## Việc còn cần làm trước khi tin tưởng chạy case API thật

1. Xác nhận cấu trúc response thật của `GET /api/v1/option-sets/:id` (đặc biệt: `options` nằm phẳng hay lồng
   trong `groups[]`?) — đọc `mappers/` trong `option-set` module hoặc gọi thử 1 lần với key thật.
2. Xác nhận PATCH có thật sự partial hay bị validate/service ép về full-upsert (xem cảnh báo ở "Switchable
   settings" phía trên) — test 1 lần trước khi viết hàng loạt case dựa trên giả định sai.
3. `APP_DOMAIN`/`API_BASE_URL` là domain theo **nhánh dev cụ thể** (`dev-<tên>-product-option-*`), không phải 1
   giá trị cố định — mỗi người chạy `optis-e2e` cần điền đúng domain instance họ đang trỏ tới.
