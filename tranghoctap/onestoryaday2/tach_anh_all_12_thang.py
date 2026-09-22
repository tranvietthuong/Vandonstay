import os
import io
import fitz  # Thư viện PyMuPDF (cài đặt: pip install PyMuPDF Pillow)
from PIL import Image

# Lấy đường dẫn tuyệt đối của thư mục gốc hiện tại (onestoryaday2)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Danh sách 12 tháng chuẩn theo tên thư mục
months = [
    "01 January", "02 February", "03 March", "04 April", 
    "05 May", "06 June", "07 July", "08 August", 
    "09 September", "10 October", "11 November", "12 December"
]

print("\n--- BẮT ĐẦU TRÍCH XUẤT VÀ GHÉP NGANG 2 TRANG THÀNH 1 BÀI CHO 12 THÁNG ---")

for idx, month_name in enumerate(months, start=1):
    month_folder = os.path.join(BASE_DIR, month_name)
    
    if not os.path.exists(month_folder):
        print(f"[!] Không tìm thấy thư mục tháng: {month_name}")
        continue
        
    # Tự động tìm file PDF trong thư mục tháng
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
        
    images_output_dir = os.path.join(month_folder, "images")
    os.makedirs(images_output_dir, exist_ok=True)
    
    try:
        doc = fitz.open(pdf_path)
        print(f"\n[*] Đang xử lý [{month_name}] - File: {os.path.basename(pdf_path)} (Tổng trang: {len(doc)})")
        
        saved_count = 0
        # Duyệt qua 31 ngày (mỗi bài tương ứng 2 trang PDF liên tiếp)
        for day in range(1, 32):
            # Bỏ qua 5 trang đầu (giới thiệu, mục lục), bắt đầu từ trang số thứ tự 6 (index 5) cho Ngày 1
            # Ngày 1: trang 6 và 7 (Index Python: 5 và 6)
            # Ngày 2: trang 8 và 9 (Index Python: 7 và 8)...
            page1_idx = 5 + (day - 1) * 2
            page2_idx = page1_idx + 1
            
            if page1_idx >= len(doc):
                break
                
            # Render trang thứ nhất thành ảnh
            page1 = doc[page1_idx]
            pix1 = page1.get_pixmap(dpi=150)  # Độ phân giải sắc nét
            img1 = Image.open(io.BytesIO(pix1.tobytes("png")))
            
            # Nếu có trang thứ hai trong bài, tiến hành render và ghép ngang
            if page2_idx < len(doc):
                page2 = doc[page2_idx]
                pix2 = page2.get_pixmap(dpi=150)
                img2 = Image.open(io.BytesIO(pix2.tobytes("png")))
                
                # --- GHÉP NGANG (CẠNH NHAU THEO CHIỀU NGANG) ---
                w = img1.width + img2.width
                h = max(img1.height, img2.height)
                combined_img = Image.new("RGB", (w, h), (255, 255, 255))
                combined_img.paste(img1, (0, 0))
                combined_img.paste(img2, (img1.width, 0))
            else:
                combined_img = img1
                
            image_filename = f"day_{day:02d}.webp"
            image_output_path = os.path.join(images_output_dir, image_filename)
            
            # Lưu thành định dạng WebP tối ưu cho hiển thị trên web
            combined_img.save(image_output_path, "WEBP", quality=85)
            saved_count += 1
            
        print(f"[✓] Thành công: Đã ghép ngang và xuất {saved_count} ảnh bài học vào '{month_name}/images/'")
        doc.close()
        
    except Exception as e:
        print(f"[!] Lỗi khi xử lý {month_name}: {e}")

print("\n--- HOÀN TẤT TOÀN BỘ QUÁ TRÌNH GHÉP NGANG 12 THÁNG! ------\n")