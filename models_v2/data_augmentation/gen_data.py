
from dotenv import load_dotenv
import os

# Tải các biến từ tệp .env vào môi trường
load_dotenv()

# Lấy API Key
MY_API_KEY = os.getenv("OPENROUTER_API_KEY")

generate_data = []
OFFENSIVE_CMT = 2000
HATE_CMT = 2000


import requests
import json
import time

def call_openrouter(API_KEY, model, system_prompt, user_content):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-OpenRouter-Title": "SPEADO Gold Standard Generator"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.8, # Tăng nhẹ để dữ liệu sinh ra đa dạng hơn, không bị lặp từ
        "response_format": { "type": "json_object" } # Ép Gemini trả về JSON chuẩn
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            result = response.json()
            # Trả về nội dung text bên trong
            return result['choices'][0]['message']['content']
        else:
            print(f"Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def generate_comment(API_KEY=MY_API_KEY, total_hate=1500, total_offensive=1500):
    model = "google/gemini-2.5-flash" # Dùng bản Flash 2.0 để tối ưu tốc độ/chi phí
    generate_data = []
    
    # System Prompt dựa trên Guideline của bạn
    system_prompt = (
        "Bạn là một chuyên gia ngôn ngữ học chuyên tạo dữ liệu huấn luyện cho AI. "
        "Nhiệm vụ của bạn là sinh ra các comment tiếng Việt theo đúng Guideline: "
        "1. OFFENSIVE (Nhãn 1): Chửi thề tự do, dùng từ thô tục (djt mẹ, vcl, lozz...) nhưng KHÔNG tấn công ai. "
        "2. HATE (Nhãn 2): Quấy rối, lăng mạ nhắm TRỰC TIẾP vào cá nhân/nhóm (thằng điên, con lon giả, phản động...). "
        "Luôn trả về định dạng JSON: {\"data\": [{\"comment\": \"...\", \"label_id\": X}, ...]}"
    )

    def batch_generate(label_name, label_id, total_count):
        count = 0
        batch_size = 20 # Mỗi lần gọi sinh 20 câu
        while count < total_count:
            user_content = f"Hãy sinh {batch_size} comment tiếng Việt nhãn {label_name} (label_id: {label_id}). " \
                           f"Văn phong mạng xã hội, đa dạng chủ đề, không dấu hoặc dùng từ lóng."
            
            raw_res = call_openrouter(API_KEY, model, system_prompt, user_content)
            
            if raw_res:
                try:
                    json_res = json.loads(raw_res)
                    new_items = json_res.get('data', [])
                    generate_data.extend(new_items)
                    count += len(new_items)
                    print(f"Đã sinh {count}/{total_count} cho nhãn {label_name}")
                except:
                    print("Lỗi parse JSON, đang thử lại...")
            
            time.sleep(1) # Tránh Rate Limit của OpenRouter

    # Tiến hành sinh dữ liệu
    print("--- Đang sinh nhãn HATE ---")
    batch_generate("HATE", 2, total_hate)
    
    print("--- Đang sinh nhãn OFFENSIVE ---")
    batch_generate("OFFENSIVE", 1, total_offensive)

    return generate_data


data = generate_comment()


file_path = "generated_comments.json"

with open(file_path, "w", encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
