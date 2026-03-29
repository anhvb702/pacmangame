# PAC-MAN

Game Pac-Man cổ điển được xây dựng bằng HTML, CSS và JavaScript thuần tuý.  
Không cần framework, không cần build tool, không cần cài đặt gì — chỉ cần mở file và chơi.

---

## Tính năng

| Tính năng | Mô tả |
|---|---|
| Gameplay cổ điển | Di chuyển trong mê cung, ăn dot, tránh ghost |
| 4 loại Ghost AI | Blinky, Pinky, Inky, Clyde — mỗi con có chiến thuật riêng |
| Power Pellet | Ăn để biến ghost thành màu xanh và săn đuổi chúng |
| Combo điểm | Chuỗi ăn ghost: 200, 400, 800, 1600 điểm |
| Dừng hình khi ăn ghost | Tạm dừng khoảng 1 giây hiển thị điểm cộng |
| Đường hầm | Hai lối thoát trái/phải nối với nhau |
| Âm thanh retro | Waka-waka, siren, nhạc nền — tất cả tạo bằng Web Audio API |
| Tắt/bật âm thanh | Nhấn nút loa trên HUD |
| Điều khiển mobile | D-pad tự động hiện trên màn hình cảm ứng |
| 5 màn chơi | Ghost nhanh hơn mỗi màn |
| Điểm cao | Lưu trữ trong localStorage của trình duyệt |
| Hiệu ứng CRT | Scanline, phát sáng, pixel art |

---

## Hướng dẫn cài đặt và chạy

### Cách 1: Mở trực tiếp (đơn giản nhất)

1. **Tải về** dự án:
   ```bash
   git clone https://github.com/your-username/Pacman.git
   cd Pacman
   ```

2. **Mở file `index.html`** bằng trình duyệt:
   - **Windows**: click đôi vào `index.html`, hoặc chạy lệnh:
     ```bash
     start index.html
     ```
   - **macOS**:
     ```bash
     open index.html
     ```
   - **Linux**:
     ```bash
     xdg-open index.html
     ```

3. **Nhấn phím bất kỳ** để bắt đầu chơi!

### Cách 2: Dùng server local (khuyên dùng khi phát triển)

Dùng **Python** (có sẵn):
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Dùng **Node.js**:
```bash
npx serve .
```

Dùng **PHP**:
```bash
php -S localhost:8080
```

Sau đó mở **http://localhost:8080** trong trình duyệt.

> **Lưu ý**: Server local chỉ cần thiết nếu trình duyệt chặn `file://` vì lý do bảo mật.  
> Hầu hết trình duyệt hiện đại đều cho phép mở `index.html` trực tiếp.

---

## Điều khiển

| Hành động | Phím |
|---|---|
| Đi lên | `Up` hoặc `W` |
| Đi xuống | `Down` hoặc `S` |
| Đi trái | `Left` hoặc `A` |
| Đi phải | `Right` hoặc `D` |
| Tắt/bật âm thanh | Nhấn nút loa trên HUD |

Trên **thiết bị cảm ứng**, D-pad sẽ tự động hiển thị.

---

## Cấu trúc dự án

```
Pacman/
├── index.html          <- File HTML chính (tải tất cả CSS và JS)
├── README.md           <- File này
├── css/
│   └── style.css       <- Giao diện (HUD, overlay, hiệu ứng CRT)
└── js/
    ├── constants.js    <- Cấu hình, giá trị, bản đồ
    ├── sound.js        <- Hệ thống âm thanh (Web Audio API)
    ├── pacman.js       <- Đối tượng Pac-Man (di chuyển, vẽ)
    ├── ghost.js        <- Đối tượng Ghost (4 AI khác nhau)
    ├── renderer.js     <- Vẽ bản đồ, HUD, popup điểm
    ├── game.js         <- Trạng thái game, va chạm, vòng lặp chính
    └── input.js        <- Xử lý phím, cảm ứng, khởi động game
```

### Thứ tự tải script

Các file JS phải được tải theo thứ tự này (mỗi file phụ thuộc vào file trước):

```
constants.js -> sound.js -> pacman.js -> ghost.js -> renderer.js -> game.js -> input.js
```

---

## AI của Ghost

Mỗi ghost có chiến thuật nhắm mục tiêu riêng trong chế độ **Chase** (truy đuổi):

| Ghost | Màu sắc | Chiến thuật |
|---|---|---|
| **Blinky** | Đỏ | Nhắm thẳng vào Pac-Man |
| **Pinky** | Hồng | Nhắm 4 ô phía trước Pac-Man |
| **Inky** | Xanh dương | Dùng vị trí Blinky để tính điểm kỳ kẹp |
| **Clyde** | Cam | Truy đuổi khi xa (>8 ô), rút lui khi gần |

Ghost luân phiên giữa chế độ **Scatter** (tuần tra góc bản đồ) và **Chase** (săn Pac-Man)
theo chu kỳ thời gian. Ăn Power Pellet sẽ kích hoạt chế độ **Frightened** (sợ hãi).

---

## Âm thanh

Tất cả âm thanh được tạo bằng **Web Audio API** — không cần file audio nào.

| Âm thanh | Khi nào phát |
|---|---|
| Waka-waka | Ăn dot (cao độ luân phiên) |
| Power whoosh | Ăn power pellet |
| Ghost chirp | Ăn ghost đang sợ hãi |
| Death spiral | Pac-Man bị ghost bắt |
| Game Over | Hết mạng |
| Level Up | Hoàn thành 1 màn |
| Win fanfare | Thắng tất cả 5 màn |
| Intro jingle | Bắt đầu game |
| Background siren | Âm nền liên tục (thay đổi khi frightened) |

---

## Tuỳ chỉnh

### Chỉnh gameplay

Chỉnh sửa file `js/constants.js` để thay đổi:
- `PACMAN_SPEED` / `GHOST_SPEED` — tốc độ di chuyển
- `FRIGHT_DURATION` — thời gian ghost bị sợ (ms)
- `TOTAL_LEVELS` — số màn chơi trước khi thắng
- `DOT_SCORE` / `POWER_SCORE` / `GHOST_SCORE_BASE` — giá trị điểm
- `MAP_TEMPLATE` — thay đổi bố cục mê cung (lưới 28x31)

### Chỉnh giao diện

Chỉnh sửa file `css/style.css` để thay đổi màu sắc, font, hiệu ứng phát sáng, v.v.

---

## Giấy phép

MIT — tự do sử dụng, chỉnh sửa và chia sẻ.
