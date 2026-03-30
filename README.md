# EV-Flashcards

English-Vietnamese flashcards web app built with ASP.NET 8 and client-side JavaScript.

---

## English

### Overview
- Learn English vocabulary with Vietnamese meanings.
- Import vocabulary from TSV/CSV text or file.
- Flashcard mode: English ↔ Vietnamese.
- Pronunciation via browser Speech Synthesis.
- IPA support (from imported data or free dictionary API fallback).
- Image lookup (Wikimedia Commons API).
- Local history storage in browser (`localStorage`), no server database.

### Input format
Supported formats:
1. `english /ipa/[TAB]vietnamese`
2. `english[TAB]ipa[TAB]vietnamese`

Example:
```text
eagle /ˈiːɡəl/	chim đại bàng
Earth /ɜːrθ/	Trái Đất
```

### Run locally
Requirements:
- .NET 8 SDK (or newer compatible SDK)

Commands:
```bash
dotnet restore
dotnet run
```

Open:
- `http://localhost:12678/index.html` (if using VS Code launch config)
- or the URL shown in terminal.

### Debug in VS Code
- Press `F5`
- Use launch profile: `Run App (Port 12678)`

### GitHub Actions
- CI workflow: `.github/workflows/ci.yml`
- Pages deploy workflow: `.github/workflows/pages.yml`

To publish UI on GitHub Pages:
1. Push to `main`
2. Repo Settings → Pages → Source: **GitHub Actions**
3. Wait for `Deploy Pages` workflow to finish

---

## Tiếng Việt

### Giới thiệu
- Ứng dụng flashcard học từ vựng Anh - Việt.
- Nhập danh sách từ bằng text/file TSV hoặc CSV.
- Chế độ thẻ học: Anh ↔ Việt.
- Phát âm bằng Speech Synthesis của trình duyệt.
- Hỗ trợ IPA (đọc từ dữ liệu nhập vào hoặc lấy từ API miễn phí).
- Hình minh họa (Wikimedia Commons API).
- Lưu lịch sử danh sách ngay trên trình duyệt (`localStorage`), không dùng database server.

### Định dạng dữ liệu nhập
Hỗ trợ:
1. `english /ipa/[TAB]vietnamese`
2. `english[TAB]ipa[TAB]vietnamese`

Ví dụ:
```text
eagle /ˈiːɡəl/	chim đại bàng
Earth /ɜːrθ/	Trái Đất
```

### Chạy local
Yêu cầu:
- .NET 8 SDK (hoặc bản mới hơn tương thích)

Lệnh:
```bash
dotnet restore
dotnet run
```

Mở:
- `http://localhost:12678/index.html` (nếu dùng cấu hình VS Code hiện tại)
- hoặc URL hiển thị trong terminal.

### Debug bằng VS Code
- Nhấn `F5`
- Chọn profile: `Run App (Port 12678)`

### GitHub Actions
- CI: `.github/workflows/ci.yml`
- Deploy Pages: `.github/workflows/pages.yml`

Để publish lên GitHub Pages:
1. Push code lên nhánh `main`
2. Vào Settings → Pages → Source chọn **GitHub Actions**
3. Chờ workflow `Deploy Pages` chạy xong

