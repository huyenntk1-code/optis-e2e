# Báo cáo: Xây dựng & Đánh giá Workflow E2E Test — App Product Option (OPTIS)

**Phạm vi thử nghiệm:** chạy thử framework E2E hiện có với case do tester **tự gán AC/test case thủ công** (không qua Jira). Case minh hoạ: tính năng **Help text** trên option Text box/Text area (4 vị trí hiển thị: Tooltip, Below the option title, Beside the option title, Below the option).

**Chưa nằm trong phạm vi báo cáo này:** luồng "chỉ gán requirement từ Jira, để AI tự sinh AC" — đề xuất kiểm thử ở vòng tiếp theo (xem mục 4).

**Thời gian thực hiện:** 21/09 – 23/09/2026, qua 2 lượt build case hoàn chỉnh (lượt 1 với option "textbox 219", lượt 2 với option "textarea 239" sau khi phát hiện và né được 1 bug thật ở backend).

---

## 1. Workflow xây dựng test E2E — chi tiết từng bước

Mỗi bước ghi rõ: ai làm phần nào, input/output, và ý nghĩa của bước đó trong toàn bộ quy trình.

| # | Tên bước | Người (tester) làm | AI làm | Output |
|---|---|---|---|---|
| 1 | **Nhận AC/test case** | Viết/paste mô tả test case (bảng: Feature, Precondition, Steps, Priority, Expected Result) — không cần Jira, chỉ cần mô tả nghiệp vụ rõ ràng | Xác nhận đây là input hợp lệ cho pipeline (skill `e2e-analyze` chấp nhận "feature description" trực tiếp) | AC thô dạng text |
| 2 | **Phân tích & trace source code thật** | Không cần làm gì, trừ khi AI hỏi lại khi phát hiện mâu thuẫn nghiệp vụ | Đọc trực tiếp source `PO/cms`, `PO/api`, `PO/tae` để xác định đúng tên field, enum, nhãn hiển thị thật — **không đoán từ tên hiển thị trên UI hay suy diễn** | Bảng AC đã đánh số (AC-1, AC-2a/b/c...) + bảng field/enum thật kèm trích dẫn file:line |
| 3 | **Quyết định cách automate (automation ladder)** | Không cần làm gì | Áp nguyên tắc: ưu tiên set qua API nếu app có sẵn endpoint, chỉ dùng UI khi không còn cách nào khác | Quyết định: set qua API, verify qua storefront (browser) |
| 4 | **Thiết kế cấu trúc case** | Xác nhận lại khi AI hỏi (vd: có đồng ý tách 4 case riêng không) | Phát hiện giới hạn kiến trúc framework (API chạy hết mới tới browser, không xen kẽ được) → đề xuất giải pháp, **dừng lại xin xác nhận** vì ảnh hưởng cách gõ lệnh chạy | Cấu trúc case (số lượng slug, tên case) đã được tester duyệt |
| 5 | **Chuẩn bị test data thật** | **Tự tạo** option set/option test thật trong CMS (vì cần quyền admin + hiểu ngữ cảnh nghiệp vụ), cung cấp ID cho AI | Xác minh lại ID/tên qua gọi trực tiếp API thật (`GET`), **không tin ảnh chụp DB/UI** — báo ngay nếu phát hiện sai lệch | ID option set/option đã xác nhận đúng, ghi vào `.env` |
| 6 | **Recon — xác nhận selector/DOM thật** | Không cần làm gì | Đọc source renderer (`TextBoxRenderer.js`, `TextAreaRenderer.js`...) + mở trình duyệt thật kiểm tra DOM sống trước khi viết assertion | Danh sách selector đã xác nhận (class CSS, cấu trúc DOM) |
| 7 | **Viết code hạ tầng (locator + page object)** | Review nếu muốn | Viết theo đúng 3 tầng kiến trúc sẵn có: `locators/*.ts` (selector thô) → `pages/*.ts` (hành động + assertion nghiệp vụ) → spec sẽ dùng lại | File locator/page object được cập nhật (thêm hàm mới, không sửa hàm cũ) |
| 8 | **Viết case thực thi** | Duyệt scope trước khi AI viết file thật | Sinh `cases.yaml` (bước API) + `browser/*.spec.ts` (bước verify storefront) | Case sẵn sàng chạy |
| 9 | **Chuẩn bị dọn dẹp (teardown)** | Chủ động chạy tay sau khi xem xong kết quả | Viết `teardown.yaml` — **không tự động chạy** | File teardown, chạy khi tester yêu cầu |
| 10 | **Chạy thật + xử lý lỗi phát sinh** | Xác nhận trước khi AI sửa bất kỳ config nào khi gặp lỗi (theo yêu cầu của tester từ lượt 2) | Chạy `pnpm e2e:all <slug>`, phân loại đúng loại lỗi (môi trường / data sai / bug thật / flaky) trước khi đề xuất hướng xử lý | Kết quả pass/fail + nguyên nhân rõ ràng cho từng lỗi |
| 11 | **Báo cáo kết quả** | Xem `report.html`, quyết định chấp nhận case hay yêu cầu điều tra thêm | Tổng hợp `report.html`/`report.csv`/`*.json` | Bằng chứng pass/fail có input/output cụ thể từng bước |

---

## 2. Đánh giá kết quả

### 2.1 Khả năng của AI

- **Trace chính xác từ source, không đoán:** ví dụ nhãn dropdown thật của help text là *"Below the option title"*, khác với *"Below option title"* tester viết ban đầu trong test case — nếu đoán theo văn bản gốc, selector sẽ sai ngay từ đầu.
- **Tự phát hiện và định vị chính xác 1 bug thật ở backend** (không phải bug do AI gây ra, mà là lỗi có sẵn trong `PO/api`) bằng cách so sánh dữ liệu trước/sau khi gọi API rồi đọc thẳng source code, chỉ ra đúng file:line gây lỗi — không dừng lại ở mức "test fail, không rõ vì sao".
- **Phân biệt được 4 loại lỗi khác nhau** trong lúc chạy: lỗi môi trường (domain/config sai), lỗi data test (ID nhập nhầm), bug thật của sản phẩm, và flaky (lỗi ngẫu nhiên do timing) — xử lý đúng hướng cho từng loại thay vì gộp chung.
- **Tự đề xuất & áp dụng workaround an toàn** khi phát hiện bug thật, mà không cần sửa code sản phẩm: đọc lại toàn bộ field hiện có qua API rồi gửi đủ trong mỗi lần PATCH.

### 2.2 Khả năng chạy tự động của framework

- **Tốc độ:** khi môi trường + data đã đúng, 1 case chạy trọn vẹn (API set + mở Chrome thật + verify storefront) mất **~8–20 giây**; chạy đủ 4 case chưa tới 1 phút.
- **Độ ổn định:** 2/8 lượt chạy browser gặp lỗi thoáng qua (1 lần phiên Chrome bị đóng đột ngột, 1 lần do widget cần thêm ~4s để render) — chạy lại ngay lập tức đều pass, xác nhận là flaky chứ không phải lỗi selector.
- **Chất lượng bằng chứng:** report có screenshot, trace Playwright (xem lại từng bước chuột/click), input/output thật của từng request API — đủ để audit lại mà không cần chạy lại.
- **Điểm nghẽn thật sự không nằm ở việc "chạy test"** mà nằm ở khâu **chuẩn bị môi trường & data** (xem mục 3) — một khi qua được khâu đó, phần chạy tự động rất nhanh và đáng tin cậy.
- **Kiến trúc tách lớp (locator/page-object/spec)** giúp các case Help text sau này (nếu cần thêm option type khác) tái sử dụng gần như toàn bộ code hạ tầng đã viết.

---

## 3. Khó khăn gặp phải & giải pháp

| # | Khó khăn | Nguyên nhân gốc | Giải pháp đã áp dụng |
|---|---|---|---|
| 1 | Cấu hình `.env` sai/lỗi thời — `APP_HANDLE`, `APP_DOMAIN`/`API_BASE_URL` trỏ nhánh dev cũ (`khanh-huyen`) trong khi máy đang chạy nhánh `dev-test1`; `API_ENV_FILE` sai chữ hoa/thường trong đường dẫn | Tồn đọng từ các lần setup trước, không ai rà soát lại khi đổi nhánh dev | Xác nhận qua `curl` trực tiếp (mã HTTP thật) thay vì tin theo comment cũ; sửa lại đúng theo nhánh đang chạy |
| 2 | Test data (ID option set/option) dễ nhầm khi lấy thủ công — có lần nhầm số **"301 total"** (tổng số dòng phpMyAdmin hiển thị) tưởng là ID option, dẫn tới PATCH sai option | Copy tay từ giao diện phpMyAdmin, không có cơ chế xác thực chéo | Luôn gọi `GET` API thật để xác nhận ID/tên trước khi build case, không dùng ảnh chụp màn hình làm căn cứ |
| 3 | Dữ liệu xem qua phpMyAdmin có lúc **không khớp** với dữ liệu API thật đang phục vụ | Nghi vấn phpMyAdmin trỏ khác database/instance so với server API đang chạy | Chuẩn hoá quy tắc: **API thật luôn là nguồn duy nhất đáng tin**, không đối chiếu qua DB viewer |
| 4 | Giới hạn kiến trúc: `cases.yaml` chạy **toàn bộ bước API xong mới chạy browser**, không xen kẽ được → không thể test tuần tự nhiều giá trị khác nhau của cùng 1 field trong 1 lần chạy | Thiết kế runner hiện tại (2 pha tách biệt) | Tách thành 4 case (slug) độc lập, dùng khả năng `pnpm e2e:all` nhận nhiều slug cùng lúc để vẫn gõ 1 lệnh |
| 5 | Công cụ trình duyệt hỗ trợ (mcp Chrome trong app) bị lỗi chụp màn hình khi mở trang CMS — xung đột với 1 extension khác ("Sidekick" của Shopify) đang chạy cùng trang | Xung đột kỹ thuật giữa 2 extension Chrome, ngoài tầm kiểm soát | Chuyển sang dùng Chrome riêng của Playwright (script tách biệt) khi cần thao tác sâu vào CMS/iframe |
| 6 | Công cụ `pnpm e2e:probe` báo "0 match" giả (false negative) cho widget storefront — vì kiểm tra ngay sau sự kiện `load` trang, trong khi widget cần thêm ~4 giây để tự render bằng JS | `probe.ts` không có cơ chế chờ động (chỉ check 1 lần ngay sau load) | Xác nhận lại bằng script chờ thêm; bản thân spec test thật dùng `expect().toBeVisible()` (tự động chờ/retry) nên không bị ảnh hưởng |
| 7 | Storefront có bật password bảo vệ, session bypass hết hạn/chưa được lưu | Cookie bypass gắn theo profile Chrome, có thời hạn | Đăng nhập lại thủ công 1 lần (`pnpm e2e:login storefront`), lưu lại cho các lần sau |
| 8 | **Bug thật ở backend:** PATCH gửi thiếu field cho 1 option trong `options[]` khiến toàn bộ field không gửi kèm (label, placeholder, required...) bị **ghi đè về `null`/mặc định**, thay vì giữ nguyên | Hàm `mapOptionFields()` trong `PO/api` được thiết kế cho nghiệp vụ **tạo mới**, nhưng bị dùng lại cho cả **cập nhật** — không phân biệt 2 luồng | Đã báo team dev kèm đúng file:line; workaround tạm ở tầng test: đọc đủ toàn bộ field hiện có qua `GET` trước, gửi lại đầy đủ trong mỗi `PATCH`, để trống (`""`) thay vì `null` cho field không cần đổi |
| 9 | Chưa kết nối MCP Jira trong phiên làm việc; skill `e2e-analyze` hiện **chưa hỗ trợ đọc field "Testcase"** (link sang issue khác) mà team hay dùng để gán test case thủ công trong Jira | Gap thiết kế của skill, chưa từng có nhu cầu này trước đây | Đã ghi nhận, cần team xác nhận cách lưu test case trong Jira trước khi bật thử luồng "Jira tự gen AC" |
| 10 | Có giai đoạn AI tự ý sửa nhiều file cấu hình + đào sâu điều tra môi trường liên tục **mà chưa hỏi xác nhận trước** → không đúng ý tester, phải yêu cầu revert lại toàn bộ | Thiếu quy tắc rõ ràng ngay từ đầu về mức độ tự chủ của AI | Thống nhất lại quy tắc làm việc: **mỗi bước phải note lại quá trình**, gặp lỗi phải **dừng và hỏi xác nhận** trước khi tự thêm/sửa bất kỳ file nào ngoài phạm vi case đang viết |

---

## 4. Đề xuất tiếp theo

1. **Báo dev team** bug full-upsert (`mapOptionFields()` — mục 3.8) để sửa tận gốc, thay vì chỉ workaround ở tầng test.
2. **Chuẩn hoá lại `.env` mẫu** theo đúng nhánh dev đang active, tránh lặp lại nhầm domain giữa các nhánh (`khanh-huyen` vs `dev-test1`...).
3. **Thử nghiệm luồng Jira** (`--jira <KEY>`) sau khi team xác nhận: (a) có kết nối Jira MCP, (b) cách format test case trong field "Testcase"/comment để skill `e2e-analyze` đọc đúng.
4. **Cân nhắc chuẩn hoá bước tạo test-data**: hiện tại tester phải tự tạo option set/option test thủ công trong CMS rồi cung cấp ID — có thể cân nhắc thêm 1 script tạo sẵn qua API để giảm sai sót thao tác tay.
