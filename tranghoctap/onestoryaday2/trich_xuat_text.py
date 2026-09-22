import os
import re
import json
import fitz  # PyMuPDF

# Tự động lấy đường dẫn tuyệt đối của thư mục chứa script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
month_name = "01 January"
month_folder = os.path.join(BASE_DIR, month_name)
pdf_path = os.path.join(month_folder, "book.pdf")
audio_dir = os.path.join(month_folder, "audio")
data_js_path = os.path.join(BASE_DIR, "data.js")

# Kiểm tra file PDF gốc
if not os.path.exists(pdf_path):
    print(f"[!] KHÔNG TÌM THẤY FILE PDF TẠI: {pdf_path}")
    print("[!] Vui lòng đảm bảo file 'book.pdf' nằm trong thư mục '01 January'.")
    exit(1)

doc = fitz.open(pdf_path)

# Tiêu đề chuẩn của 31 bài trong tháng 1
all_titles = [
    "The Sky Is Blue!", "Fruit or Vegetables?", "Report Card", "Tall Tom", "Basketball Is Fun",
    "A Picture for Dad", "Many Kinds of Milk", "Colours", "A Windy Christmas", "Everything Is New!",
    "Save the World", "A Bird and a Cat", "I Can't Stop!", "The First Word", "Uncle John Loves to Ski",
    "A Young Artist", "Taking Turns", "Lights in the House", "Talking Pen", "Why Do We Sleep?",
    "A Day at the Beach", "A Lot of Socks", "Who Likes Cake?", "Big Snow Days", "My Cat",
    "My Apple Tree", "Day or Night", "How Do You Get Around?", "What Do Birds Eat?", "A Proud Father",
    "Round and Round"
]

# Đọc dữ liệu hiện tại để giữ lại các bài đã căn chỉnh mốc thời gian và phiên âm chi tiết (1-5, 14-23)
existing_data = {}
if os.path.exists(data_js_path):
    try:
        with open(data_js_path, "r", encoding="utf-8") as f:
            content = f.read()
            # Bóc tách chuỗi JSON từ file data.js
            json_str = content.replace("const STORIES_DATA = ", "").strip().rstrip(";")
            parsed = json.loads(json_str)
            for item in parsed.get(month_name, []):
                existing_data[item["day"]] = item
    except Exception as e:
        print(f"[!] Lưu ý khi đọc data.js cũ: {e}")

# Quét danh sách file audio thực tế
audio_files = os.listdir(audio_dir) if os.path.exists(audio_dir) else []

start_page_index = 5  # Bài 1 bắt đầu từ trang index 5
data_list = []

print(f"\n--- BẮT ĐẦU TRÍCH XUẤT 31 BÀI CHO '{month_name}' ---")

for day in range(1, 32):
    title = all_titles[day - 1]
    prefix = f"A01{day:02d}"

    # Tìm file MP3 tương ứng
    matched_audio = ""
    for f in audio_files:
        if f.startswith(prefix) and f.endswith(".mp3"):
            matched_audio = f
            break

    # Nếu bài đã có dữ liệu chuẩn hóa chi tiết (nhiều hơn 1 câu và có bản dịch/IPA), giữ nguyên
    if day in existing_data and len(existing_data[day].get("sentences", [])) > 1:
        item = existing_data[day]
        item["title"] = title
        item["image"] = f"{month_name}/images/day_{day:02d}.webp"
        if matched_audio:
            item["audio"] = f"{month_name}/audio/{matched_audio}"
        data_list.append(item)
        print(f"✓ Day {day:02d}: Giữ nguyên bản đã căn chỉnh chi tiết ({title})")
        continue

    # Trích xuất trang bài đọc (trang bên trái) từ PDF
    left_page_idx = start_page_index + (day - 1) * 2
    raw_text = ""
    if left_page_idx < len(doc):
        raw_text = doc[left_page_idx].get_text()

    # Làm sạch văn bản trích xuất
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    filtered_lines = []
    for l in lines:
        if l.isdigit():  # Bỏ số trang
            continue
        if l.lower().startswith("story") or l.lower().startswith("one story"):
            continue
        if l.lower() == title.lower():  # Bỏ dòng lặp tiêu đề
            continue
        filtered_lines.append(l)

    full_body = " ".join(filtered_lines)
    # Tách câu theo dấu kết thúc câu (. ? !)
    raw_sentences = re.split(r'(?<=[.?!])\s+', full_body)

    sentences = []
    t_start = 4.5  # Mốc thời gian mặc định sau đoạn dạo đầu
    for s in raw_sentences:
        clean_s = s.strip()
        if len(clean_s) > 2:
            sentences.append({
                "start": round(t_start, 1),
                "en": clean_s,
                "ipa": "",
                "vi": ""
            })
            t_start += 3.5

    # Trường hợp dự phòng nếu trang PDF không có text dạng vector
    if not sentences:
        sentences.append({
            "start": 4.5,
            "en": f"Day {day}: {title}",
            "ipa": "",
            "vi": f"Bài ngày {day}: {title}"
        })

    data_list.append({
        "day": day,
        "title": title,
        "image": f"{month_name}/images/day_{day:02d}.webp",
        "audio": f"{month_name}/audio/{matched_audio}" if matched_audio else "",
        "sentences": sentences
    })
    print(f"✓ Day {day:02d}: Trích xuất tự động thành công -> {len(sentences)} câu ({title})")

# Ghi ra file data.js
js_content = "const STORIES_DATA = {\n  \"" + month_name + "\": " + json.dumps(data_list, ensure_ascii=False, indent=2) + "\n};\n"

with open(data_js_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"\n HOÀN TẤT! Đã đồng bộ đầy đủ 31 bài vào: {data_js_path}\n")