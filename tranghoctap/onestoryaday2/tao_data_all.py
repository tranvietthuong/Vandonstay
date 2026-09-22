import os
import re
import json
import fitz  # PyMuPDF (cài đặt: pip install PyMuPDF)

# Lấy đường dẫn tuyệt đối của thư mục gốc hiện tại (onestoryaday2)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Danh sách 12 tháng chuẩn
months = [
    "01 January", "02 February", "03 March", "04 April", 
    "05 May", "06 June", "07 July", "08 August", 
    "09 September", "10 October", "11 November", "12 December"
]

print("\n--- BẮT ĐẦU TẠO FILE DỮ LIỆU NỘI DUNG (data_01 đến data_12) CHO 12 THÁNG ---")

for idx, month_name in enumerate(months, start=1):
    month_folder = os.path.join(BASE_DIR, month_name)
    
    if not os.path.exists(month_folder):
        print(f"[!] Không tìm thấy thư mục tháng: {month_name}")
        continue
        
    # Tìm file PDF tương ứng trong thư mục tháng
    pdf_path = None
    possible_names = [f"Book {idx}", f"Book {idx}.pdf", f"book {idx}", f"book {idx}.pdf"]
    for name in possible_names:
        full_p = os.path.join(month_folder, name)
        if os.path.exists(full_p):
            pdf_path = full_p
            break
            
    if not pdf_path:
        for file in os.listdir(month_folder):
            if file.lower().endswith(".pdf"):
                pdf_path = os.path.join(month_folder, file)
                break
                
    if not pdf_path:
        print(f"[!] Không tìm thấy file PDF nào trong thư mục: {month_name}")
        continue
        
    try:
        doc = fitz.open(pdf_path)
        print(f"\n[*] Đang đọc văn bản [{month_name}] - File: {os.path.basename(pdf_path)} (Tổng trang: {len(doc)})")
        
        month_data_list = []
        
        # Duyệt qua 31 ngày (mỗi bài lấy 2 trang liên tiếp tương ứng với hình ảnh ghép ngang)
        for day in range(1, 32):
            # Bắt đầu từ trang số thứ tự 6 (index 5) cho Ngày 1 (Lấy trang 6 & 7)
            page1_idx = 5 + (day - 1) * 2
            page2_idx = page1_idx + 1
            
            if page1_idx >= len(doc):
                break
                
            # Trích xuất text từ 2 trang của bài học
            text_p1 = doc[page1_idx].get_text()
            text_p2 = doc[page2_idx].get_text() if page2_idx < len(doc) else ""
            combined_text = text_p1 + "\n" + text_p2
            
            # Làm sạch text, loại bỏ số trang và các từ khóa thừa
            lines = [l.strip() for l in combined_text.split("\n") if l.strip()]
            filtered_lines = []
            
            # Mặc định lấy tên bài theo ngày nếu chưa có tiêu đề riêng
            story_title = f"Story Day {day}"
            
            for l in lines:
                if l.isdigit() or len(l) <= 1:  # Bỏ số trang đơn lẻ
                    continue
                if "story a day" in l.lower() or "contents" in l.lower():
                    continue
                # Dòng đầu tiên hoặc dòng ngắn xuất hiện ở trang đầu bài có thể là tiêu đề
                if len(filtered_lines) == 0 and len(l) < 40 and not l.endswith('.'):
                    story_title = l
                filtered_lines.append(l)
                
            # Tách chuỗi thành các câu hoàn chỉnh dựa vào dấu kết thúc (. ? !)
            full_body = " ".join(filtered_lines)
            raw_sentences = re.split(r'(?<=[.?!])\s+', full_body)
            
            sentences = []
            t_start = 4.8
            for s in raw_sentences:
                clean_s = s.strip()
                if len(clean_s) > 3:
                    sentences.append({
                        "start": round(t_start, 1),
                        "en": clean_s,
                        "ipa": "",  # Có thể tự sinh hoặc bổ sung IPA chuẩn sau
                        "vi": ""   # Bản dịch tiếng Việt tương ứng
                    })
                    t_start += 3.5
                    
            if not sentences:
                sentences.append({
                    "start": 4.8,
                    "en": f"Day {day} lesson content.",
                    "ipa": "",
                    "vi": f"Nội dung bài học ngày {day}."
                })
                
            # Đưa vào danh sách dữ liệu của tháng
            month_data_list.append({
                "day": day,
                "title": story_title,
                "image": f"{month_name}/images/day_{day:02d}.webp",
                "audio": f"{month_name}/audio/Track{day:02d}.mp3",
                "sentences": sentences
            })
            
        doc.close()
        
        # Ghi ra file data_01.js đến data_12.js tương ứng
        data_file_name = f"data_{idx:02d}.js"
        data_file_path = os.path.join(BASE_DIR, data_file_name)
        
        js_content = f"if (typeof STORIES_DATA === 'undefined') {{\n  var STORIES_DATA = {{}};\n}}\n\nSTORIES_DATA[\"{month_name}\"] = " + json.dumps(month_data_list, ensure_ascii=False, indent=2) + ";\n"
        
        with open(data_file_path, "w", encoding="utf-8") as out_f:
            out_f.write(js_content)
            
        print(f"[✓] Thành công: Đã tạo file {data_file_name} cho {month_name}")
        
    except Exception as e:
        print(f"[!] Lỗi khi xử lý nội dung {month_name}: {e}")

print("\n--- HOÀN TẤT TỰ ĐỘNG TẠO 12 FILE DỮ LIỆU NỘI DUNG! ---\n")