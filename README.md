# optis-e2e — bộ khung E2E cho OPTIS Product Options

> Đọc `SETUP.md` để biết **làm gì, gõ gì, ra gì** từng bước. File này chỉ giải thích **kiến trúc & vì sao thiết
> kế vậy** — không phải hướng dẫn thao tác.

## Framework này lấy gì từ đâu

| Phần | Lấy từ | Vì sao |
|---|---|---|
| `src/` (engine: config/auth/doctor/login/probe/retry/report) | `e2e-main` (gần như nguyên vẹn — code này app-agnostic thật, đã đọc kỹ để xác nhận) | Tách biệt AI (sinh test) khỏi engine (chạy test) — chạy lại không tốn token, kết quả tái lặp |
| `.claude/commands/`, `.claude/skills/` | `e2e-main` (nguyên vẹn, trừ `project-notes.md`) | 7-bước `analyze → recon → gen → data → run → flaky → report`, có 2 điểm dừng hỏi người: duyệt kế hoạch + mâu thuẫn nghiệp vụ |
| `.claude/skills/_shared/project-notes.md` | **Viết mới hoàn toàn** — đọc trực tiếp `PO/api`, `PO/cms`, `PO/tae` | Tri thức riêng app OPTIS: route thật, class/id thật, gotcha Shadow DOM/iframe/theme-dependent |
| `tests/fixtures/`, `tests/locators/`, `tests/pages/` | Sườn từ `tests-pom-optimized` (POM cũ của bạn), nội dung viết lại theo class/route thật của OPTIS | Giữ cách tổ chức bạn đã quen — "1 khái niệm = 1 file locator + 1 file page" |
| `cases/OPOS-DEMO-01/` | Mẫu mới, theo đúng format `e2e-main` (`plan.md`/`coverage.json`/`cases.yaml`/`browser/*.spec.ts`) | Ví dụ chạy được thật, minh hoạ phối hợp API-setup + browser-verify |

## Vì sao 2 tầng "engine" và "POM" tồn tại song song

`e2e-main` gốc không có khái niệm Page Object — mỗi case tự viết locator thẳng trong
`cases/<slug>/browser/<slug>.spec.ts`. Với 1 app nhỏ việc đó ổn, nhưng OPTIS có **nhiều case dùng lại đúng những
thao tác giống nhau** (mở PDP, điền option, add to cart, mở mini-cart...) — nếu mỗi case tự viết lại locator, 1
lần đổi HTML thật phải sửa ở N chỗ. Nên `tests/pages/*.page.ts` đóng vai trò **lớp dùng chung**, còn
`cases/<slug>/browser/*.spec.ts` chỉ **gọi** page object, giữ đúng tinh thần POM cũ mà vẫn tận dụng được máy
chạy/báo cáo/retry của `e2e-main`.

## Cấu trúc thư mục

```
optis-e2e/
├── README.md, SETUP.md              ← đọc SETUP.md để bắt đầu
├── package.json, tsconfig.json, playwright.config.ts, vitest.config.ts
├── e2e.config.yaml                  ← target api/cms/storefront, đã điền sẵn route thật OPTIS
├── .env.example                     ← copy thành .env, điền domain/key thật
├── .claude/
│   ├── commands/{e2e.md, e2e-full.md}
│   └── skills/{e2e-analyze,e2e-recon,e2e-gen,e2e-data,e2e-run,e2e-flaky,e2e-report}/SKILL.md
│       └── _shared/{core.md, project-notes.md ⭐, references/*.md}
├── src/                              ← engine, KHÔNG cần sửa để dùng
├── tests/
│   ├── fixtures/fixtures.ts
│   ├── locators/{cms-option-set, storefront-option-widget, storefront-cart}.locators.ts
│   ├── pages/{base, cms-option-set, storefront-option-widget, storefront-cart}.page.ts
│   ├── specs/                       ← (trống — nơi bạn/tôi thêm spec KHÔNG gắn với 1 case Jira cụ thể)
│   └── *.test.ts                    ← unit test của chính engine (pnpm test), không đụng vào
├── cases/OPOS-DEMO-01/               ← case mẫu chạy được thật, xem SETUP.md
└── reports/                          ← output, tự sinh, đã .gitignore
```

## project-notes.md — file quan trọng nhất để đọc trước khi viết case mới

`.claude/skills/_shared/project-notes.md` chứa toàn bộ phát hiện từ việc đọc source thật ngày 2026-09-14:
route API chính xác, tên class/id thật trên storefront, xác nhận iframe/Shadow DOM ở đâu áp dụng, cảnh báo
mini-cart phụ thuộc theme, nghi vấn PATCH partial-vs-full-upsert. **Đọc file này trước khi tự đoán selector hay
endpoint** — đỡ mất công dò lại những gì đã xác nhận.
