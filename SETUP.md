# SETUP — từng bước một, gõ gì / bấm gì / thấy gì

> Làm đúng thứ tự. Mỗi bước có: **lệnh gõ** → **cái xảy ra** → **output đúng phải thấy**. Nếu output khác, đừng
> làm bước sau — sửa xong bước đang lỗi rồi mới đi tiếp.

## Bước 0 — Cài trên máy (làm 1 lần, trước khi mở VS Code)

Cần: **Node ≥ 20**, **pnpm ≥ 9**, **Google Chrome thật đã cài** (không dùng Chromium đi kèm Playwright — code
này cố tình ép `channel: "chrome"` để qua được Cloudflare/2FA của Shopify, xem `src/chrome-opts.ts`).

```bash
node -v          # phải ra v20.x hoặc mới hơn
corepack enable   # bật pnpm đi kèm Node (hoặc: npm install -g pnpm)
pnpm -v           # phải ra 9.x hoặc mới hơn
google-chrome --version   # nếu báo "command not found", cài bằng dòng dưới
```

Nếu chưa có Chrome (máy bạn đã tải sẵn `~/Downloads/google-chrome-stable_current_amd64.deb`):
```bash
sudo dpkg -i ~/Downloads/google-chrome-stable_current_amd64.deb || sudo apt-get install -f -y
```

## Bước 1 — Mở trong VS Code

```bash
code /home/bss-group-19/Optis/optis-e2e
```
Hoặc: VS Code → File → Open Folder... → chọn `optis-e2e`. Mở Terminal tích hợp: **Terminal → New Terminal**
(hoặc phím tắt `` Ctrl+` ``) — mọi lệnh dưới đây gõ trong terminal này.

*(Tuỳ chọn, không bắt buộc)*: cài extension **Playwright Test for VS Code** (Microsoft) — cho phép chạy/debug
từng test bằng nút bấm trực tiếp trong VS Code thay vì gõ lệnh, và xem trace ngay trong editor.

## Bước 2 — Cài dependencies

```bash
pnpm install
```

**Output đúng phải thấy:** danh sách package tải về, kết thúc bằng dòng tương tự:
```
Done in Xs
```
Không có dòng `ERR_PNPM_*` màu đỏ. Nếu lỗi thiếu `pnpm-lock.yaml` phù hợp, chạy `pnpm install --no-frozen-lockfile`.

## Bước 3 — Tạo `.env`

```bash
cp .env.example .env
```
Mở file `.env` vừa tạo (VS Code tự mở được, hoặc `code .env`), điền:

| Biến | Lấy ở đâu |
|---|---|
| `APP_DOMAIN` | Mở `PO/api/.env` (repo backend đang chạy) → copy giá trị `CMS_URL`, bỏ `https://` |
| `API_BASE_URL` | Mở `PO/api/.env` → copy nguyên giá trị `SERVER_URL` (giữ `https://`) |
| `API_ENV_FILE` | Nếu 3 repo `PO/api`, `PO/cms`, `PO/tae` nằm cùng cấp với `optis-e2e/` thì giữ nguyên `../PO/api/.env` — engine tự đọc `SHOPIFY_API_KEY`/`SHOPIFY_API_SECRET` từ đó, khỏi copy tay |

`STORE=khanh-huyen-store` và `APP_HANDLE=product-options-by-bss` đã điền sẵn đúng — không cần đổi trừ khi bạn
test trên store khác.

## Bước 4 — `pnpm e2e:doctor` (kiểm tra môi trường)

```bash
pnpm e2e:doctor
```

**Output đúng phải thấy** (từng dòng, dựa trên `src/doctor.ts` — 5 mục kiểm tra):
```
E2E doctor — checking run prerequisites

[1] Google Chrome (required when selected browser targets exist)
[2] e2e.config.yaml
  ✅ Config parsed and validated (${VAR} resolved)
[3] Selected targets
  ✅ api: session-JWT signed (secret resolved OK)
  ❌ cms: Chrome profile missing — run `pnpm e2e:login cms`
  ❌ storefront: Chrome profile missing — run `pnpm e2e:login storefront`
[4] API reachable
  ✅ https://dev-<ten-nhanh>-product-option-api.dev-bsscommerce.com/life-check → 200

❌ 2 blocking issue(s) — fix before running.
```
2 dòng `❌ ... Chrome profile missing` là **bình thường ở lần đầu** — chưa đăng nhập thì chưa có profile. Sang
bước 5 để tạo. Nếu dòng `[3] api` báo lỗi ký token (`could not sign token`) → `SHOPIFY_API_KEY`/`SHOPIFY_API_SECRET`
sai hoặc chưa đọc được từ `API_ENV_FILE` — kiểm tra lại đường dẫn.

## Bước 5 — Đăng nhập (bắt buộc làm tay, 1 lần)

```bash
pnpm e2e:login cms
```
**Cái xảy ra:** 1 cửa sổ **Google Chrome thật** tự mở ra, vào thẳng trang đăng nhập Shopify của
`khanh-huyen-store`. Terminal hiện:
```
>>> Log in to Shopify (email + password + 2FA code), then open the b2bridge app in the window.
>>> When done, CLOSE the window — the session is saved to the profile: .auth/cms-profile
```
(dòng chữ "b2bridge" là chữ cứng còn sót lại trong code gốc — không liên quan gì tới OPTIS, bỏ qua).
**Bạn làm:** đăng nhập Shopify bằng tài khoản/password/2FA thật của bạn → sau khi vào được Admin, điều hướng
tới app **OPTIS Product Options** (hoặc mở lại URL
`admin.shopify.com/store/khanh-huyen-store/apps/product-options-by-bss`) để chắc chắn session app cũng được
lưu → **đóng cửa sổ Chrome đó lại** (không phải Ctrl+C ở terminal, phải đóng đúng cửa sổ).
**Output đúng sau khi đóng:**
```
✅ Session saved to profile /home/.../optis-e2e/.auth/cms-profile
```

Lặp lại cho storefront (nếu store có bật password, nhập password `1` ngay trong cửa sổ này trước khi đóng —
cookie bypass sẽ được lưu chung vào profile):
```bash
pnpm e2e:login storefront
```

## Bước 6 — `pnpm e2e:doctor` lại — xác nhận hết lỗi

```bash
pnpm e2e:doctor
```
**Output đúng:** cả 2 dòng `cms`/`storefront` giờ thành `✅ ... profile present`, kết thúc bằng:
```
✅ Ready to run.
```

## Bước 7 — Điền test data cho case mẫu, rồi chạy thật

Mở `cases/OPOS-DEMO-01/data.md`, làm đúng theo đó (tạo 1 option set test + 1 sản phẩm test trong CMS, lấy ID),
thêm 5 dòng vào cuối `.env`:
```
TEST_OPTION_SET_ID=42
TEST_OPTION_ID=123
TEST_PRODUCT_HANDLE=ten-san-pham-test
TEST_PRODUCT_GID=gid://shopify/Product/987654321
TEST_OPTION_NAME=Customer Name
```

Chạy trọn case (doctor → api → browser → report, theo đúng `src/all.ts`):
```bash
pnpm e2e:all OPOS-DEMO-01
```

**Output đúng, theo đúng thứ tự thật sự chạy:**
```
########## doctor ##########
✅ Ready to run.

########## OPOS-DEMO-01 ##########

--- OPOS-DEMO-01: API ---
API steps: 3/3 passed → reports/OPOS-DEMO-01/data/api-report.json

--- OPOS-DEMO-01: browser ---
Running 2 tests using 2 workers
  ✓  BSS-REQ-01: dấu * hiện trên PDP sau khi bật Required qua API (2.1s)
  ✓  BSS-REQ-02: Add to cart bị chặn khi bỏ trống field required (1.8s)
2 passed (4.2s)

>>> OPOS-DEMO-01: canonical data → reports/OPOS-DEMO-01/data/report.json · report → reports/OPOS-DEMO-01/report.html
```
Trong lúc bước browser chạy, **1 cửa sổ Chrome khác mở ra** (vì `E2E_HEADLESS` để trống/0 trong `.env`) — bạn
nhìn thấy nó tự mở PDP, tự đọc trang, không cần bạn thao tác gì.

Nếu `API steps: 2/3 passed` hoặc thấp hơn 3 → mở `reports/OPOS-DEMO-01/data/api-report.json` xem đúng request
nào fail, đối chiếu với `cases.yaml` — khả năng cao do `TEST_OPTION_SET_ID`/`TEST_OPTION_ID` sai hoặc option set
chưa có option Text box nào.

## Bước 8 — Xem kết quả

```bash
# Cách 1: mở bằng trình duyệt hệ thống
xdg-open reports/OPOS-DEMO-01/report.html
# Cách 2 (trong VS Code): click chuột phải vào file trong Explorer → "Reveal in File Explorer",
# hoặc cài extension "Live Preview" của Microsoft rồi bấm nút Preview góc trên phải editor.
```
Trang mở ra có: bảng case (input/output thật từng dòng), ảnh chụp PDP đính kèm ở 2 case browser, mục "Bug" (rỗng
vì chưa có `/e2e report` viết vào — bình thường ở giai đoạn này).

## Bước 9 — Dọn dẹp (bắt buộc, để lần chạy sau không bị lệch trạng thái)

```bash
pnpm e2e:run cases/OPOS-DEMO-01/teardown.yaml
```
**Output đúng:**
```
API steps: 1/1 passed → reports/OPOS-DEMO-01-teardown/api-report.json
```

## Bước 10 — Viết case tiếp theo

Copy nguyên cấu trúc `cases/OPOS-DEMO-01/` sang `cases/<slug-mới>/`, đổi nội dung theo AC bạn muốn test — Page
Object đã có sẵn ở `tests/pages/` dùng lại được ngay, không cần viết locator từ đầu trừ khi thao tác mới hoàn
toàn (khi đó thêm method vào đúng `*.locators.ts`/`*.page.ts` tương ứng, không tạo file mới nếu khái niệm cũ đã
có file).

Nếu bạn dùng Claude Code ngay trong VS Code (extension Claude Code), gõ thẳng trong chat của nó:
```
/e2e analyze --jira OPOS-XX
```
rồi để nó tự chạy tiếp qua `/e2e-full` — nó sẽ tự đọc `project-notes.md`, tự đề xuất kế hoạch, dừng lại hỏi bạn
duyệt trước khi sinh code test thật (đúng quy trình đã mô tả ở `README.md` gốc của `e2e-main` mà bạn đã đọc qua).
