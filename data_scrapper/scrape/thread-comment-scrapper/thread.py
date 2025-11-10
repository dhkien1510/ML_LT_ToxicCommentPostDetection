import json
import csv
from typing import Dict, List, Optional
import argparse
import jmespath
from parsel import Selector
from nested_lookup import nested_lookup
from playwright.sync_api import sync_playwright
import re # Import re để trích xuất code

def get_post_code_from_url(url: str) -> Optional[str]:
    """Trích xuất mã bài đăng (ví dụ: DPgqkOUDgoZ) từ URL."""
    match = re.search(r"/post/([^/?]+)", url)
    if match:
        return match.group(1)
    return None

def parse_thread(data: Dict) -> Dict:
    """Parse Threads post JSON dataset for the most important fields"""
    
    # --- ĐÃ HOÀN NGUYÊN VỀ BẢN GỐC ---
    # Logic JMESPath này là ĐÚNG cho cả post chính và replies
    result = jmespath.search(
        """{
        text: post.caption.text,
        published_on: post.taken_at,
        id: post.id,
        pk: post.pk,
        code: post.code,
        username: post.user.username,
        user_pic: post.user.profile_pic_url,
        user_verified: post.user.is_verified,
        user_pk: post.user.pk,
        user_id: post.user.id,
        has_audio: post.has_audio,
        reply_count: view_replies_cta_string,
        like_count: post.like_count,
        images: post.carousel_media[].image_versions2.candidates[1].url,
        image_count: post.carousel_media_count,
        videos: post.video_versions[].url
        }""",
        data,
    )

    if not result:
        # Nếu không parse được (ví dụ: post đã bị xóa), trả về None
        return None

    result["videos"] = list(set(result.get("videos") or []))
    result[
        "url"
    ] = f"https://www.threads.net/@{result['username']}/post/{result['code']}"
    # print(f"Post URL: {result['url']}") # Removed print to reduce console spam
    return result


def scrape_thread(url: str, comment_count: int) -> Dict[str, List[Dict]]:
    """
    Scrape Threads post and replies from a given URL.
    It will scrape the main post + 'comment_count' replies.
    """
    
    target_code = get_post_code_from_url(url)
    if not target_code:
        raise ValueError(f"Không thể trích xuất mã bài đăng từ URL: {url}")
        
    # Mục tiêu là 1 bài post chính + N bình luận
    target_total_posts = comment_count + 1
    
    print(f"Đang cào dữ liệu từ: {url}. Mã mục tiêu: {target_code}.")
    print(f"Mục tiêu: {comment_count} bình luận (tổng cộng {target_total_posts} bài đăng).")
    
    posts = []
    MAX_SCROLLS = 20 # Giới hạn cuộn để tránh lặp vô tận

    with sync_playwright() as pw:
        # start Playwright browser
        browser = pw.chromium.launch()
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        page.goto(url)
        
        # Wait for initial load
        try:
            page.wait_for_selector("[data-pressable-container=true]", timeout=10000)
        except Exception:
             print("Cảnh báo: Hết thời gian chờ tải trang. Tiếp tục với dữ liệu có sẵn.")

        scroll_count = 0
        # Dùng set để lọc ID đã thấy, tăng tốc độ
        post_ids = set()
        
        while len(posts) < target_total_posts and scroll_count < MAX_SCROLLS:
            scroll_count += 1
            
            if scroll_count > 1: # Không cần cuộn ở lần đầu tiên
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                print(f"Đang cuộn trang ({scroll_count}/{MAX_SCROLLS})...")
                page.wait_for_timeout(2500) # Tăng thời gian chờ một chút

            current_posts_count = len(posts)
            
            selector = Selector(page.content())
            hidden_datasets = selector.css('script[type="application/json"][data-sjs]::text').getall()

            # --- SỬA LỖI LOGIC ---
            # Chúng ta sẽ tìm *một* khối JSON chính và xử lý tất cả các nhóm bên trong nó
            for hidden_dataset in hidden_datasets:
                # 1. Tìm khối JSON có chứa mã post mục tiêu
                if target_code in hidden_dataset and "thread_items" in hidden_dataset:
                    try:
                        data = json.loads(hidden_dataset)
                        thread_items_list = nested_lookup("thread_items", data)
                        if not thread_items_list:
                            continue

                        # 2. Xử lý TẤT CẢ các nhóm (thread_group) bên trong khối đó
                        for thread_group in thread_items_list:
                            if not thread_group: continue
                            
                            # 3. Parse tất cả post trong nhóm
                            for post_data in thread_group:
                                # --- ĐÂY LÀ SỬA LỖI QUAN TRỌNG ---
                                # Truyền trực tiếp post_data (chứa {"post": {...}})
                                parsed_post = parse_thread(post_data)
                                
                                if not parsed_post:
                                    continue
                                
                                post_id = parsed_post.get('id')
                                
                                # 4. Thêm vào danh sách nếu là post mới
                                if post_id and post_id not in post_ids:
                                    posts.append(parsed_post)
                                    post_ids.add(post_id)
                        
                        # Đã tìm thấy và xử lý khối JSON chính,
                        # thoát khỏi vòng lặp 'hidden_dataset'
                        break 
                            
                    except json.JSONDecodeError:
                        continue
            
            # Kiểm tra xem có bình luận mới nào được tải không
            if len(posts) == current_posts_count and scroll_count > 1:
                print("Không có bình luận mới được tải sau khi cuộn. Dừng lại.")
                break 

            print(f"Tổng số bài đăng đã tìm thấy: {len(posts)}")
            
        browser.close()
        
        if not posts:
            raise ValueError(f"Không thể tìm thấy dữ liệu cho post {target_code} trên trang.")
        
        # Sắp xếp lại để đảm bảo post chính luôn ở đầu
        main_post_index = -1
        for i, post in enumerate(posts):
            if post.get("code") == target_code:
                main_post_index = i
                break
        
        if main_post_index != -1:
            main_post = posts.pop(main_post_index)
            posts.insert(0, main_post)
        elif posts[0].get("code") != target_code:
             print(f"Cảnh báo: Không tìm thấy bài đăng chính {target_code} trong dữ liệu.")
             pass # Lấy post đầu tiên làm post chính (dự phòng)

        # Cắt danh sách posts theo số lượng mục tiêu (N bình luận + 1 post chính)
        posts = posts[:target_total_posts]

        # Trả về kết quả
        return {
            "thread": posts[0],
            "replies": posts[1:],
        }


def to_csv(data: dict, output):
    """
    Ghi dữ liệu post chính và các bình luận ra file CSV.
    Thay thế ký tự xuống dòng bằng dấu cách để đảm bảo mỗi bình luận trên một dòng.
    """
    
    # 1. Define the final fieldnames (column headers)
    fieldnames = ['author', 'comment', 'title']
    
    # 2. Extract the main post
    thread_post = data.get('thread')
    if not thread_post:
        print("Cảnh báo: Không tìm thấy dữ liệu thread để ghi.")
        return
        
    # Lấy text của post chính làm tiêu đề
    title_text_raw = thread_post.get('text', 'N/A')
    # Clean newlines and extra whitespace from the title text
    title_text_clean_full = " ".join(str(title_text_raw).split())
    words = title_text_clean_full.split()
    if len(words) > 20:
        # Lấy 20 từ đầu tiên và thêm "..."
        title_text_clean = " ".join(words[:20]) + "..."
    else:
        # Giữ nguyên nếu tiêu đề ngắn
        title_text_clean = title_text_clean_full
    # --- KẾT THÚC LOGIC MỚI ---

    # 3. Prepare the data list (main post + replies)
    final_posts = [thread_post] + data.get('replies', [])
    final_data = []
    
    # Vòng lặp chuyển đổi dữ liệu
    for post in final_posts:
        # Lấy text của bình luận
        comment_text_raw = post.get('text', '')
        # Clean newlines and extra whitespace from the comment text
        comment_text_clean = " ".join(str(comment_text_raw).split())
        
        # Tạo dictionary cho mỗi dòng
        row = {
            'author': post.get('username'),
            'comment': comment_text_clean, # Dùng text đã xử lý
            'title': title_text_clean      # Dùng tiêu đề đã xử lý
        }
        final_data.append(row)

    print(f"Đang ghi {len(final_data)} bản ghi vào {output} với tiêu đề: '{title_text_clean[:50]}...'")

    with open(output, 'w', newline='', encoding='UTF-8-sig') as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=fieldnames,
            extrasaction='ignore', 
            quoting=csv.QUOTE_ALL
        )
        
        # Write the header row
        writer.writeheader()
        
        # Write all data rows
        writer.writerows(final_data)


def main(argv=None):
    parser = argparse.ArgumentParser(add_help=False, description=('Cào dữ liệu bài đăng và bình luận trên Threads'))
    
    parser.add_argument('--link', '-lk', help='Link của bài đăng Threads') 
    parser.add_argument('--output', '-o', help='Tên file output (định dạng CSV)')
    
    parser.add_argument('--size', '-s', type=int, default=0, help='Số lượng *bình luận* (replies) muốn cào (mặc định: 0)')

    args = parser.parse_args() if argv is None else parser.parse_args(argv)
    thread_link = args.link
    output = args.output
    # Lấy giá trị size, bây giờ nó có nghĩa là số lượng bình luận
    comment_count = args.size

    if (not thread_link) or not output:
        parser.print_usage()
        raise ValueError('Bạn cần chỉ định link Threads và tên file output.')

    # Truyền số lượng bình luận (comment_count) vào hàm scrape_thread
    data = scrape_thread(thread_link, comment_count)
    to_csv(data, output)

if __name__ == "__main__":
    main()