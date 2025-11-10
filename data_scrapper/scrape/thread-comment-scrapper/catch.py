import json
import csv
from typing import Dict
import argparse
import jmespath
from parsel import Selector
from nested_lookup import nested_lookup
from playwright.sync_api import sync_playwright

import re
def parse_thread(data: Dict) -> Dict:
    """Parse Twitter tweet JSON dataset for the most important fields"""
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
    result["videos"] = list(set(result["videos"] or []))
    # if result["reply_count"] and type(result["reply_count"]) != int:
    #     result["reply_count"] = int(result["reply_count"].split(" ")[0])
    result[
        "url"
    ] = f"https://www.threads.net/@{result['username']}/post/{result['code']}"
    print(f"https://www.threads.net/@{result['username']}/post/{result['code']}")
    return result
def scrape_thread(url: str, comment_count: int) -> dict:
    """
    Scrape Threads post and replies from a given URL using Playwright.
    Updated for 2025: capture GraphQL responses instead of HTML JSON.
    """
    import re, json
    from nested_lookup import nested_lookup
    from jmespath import search as jmes_search

    target_total_posts = comment_count + 1
    print(f"Đang cào dữ liệu từ: {url}. Mục tiêu: {comment_count} bình luận (tổng cộng {target_total_posts} bài đăng).")

    # Lấy mã bài đăng từ URL
    m = re.search(r'/post/([\w-]+)', url)
    if not m:
        raise ValueError("Không tìm thấy mã bài trong URL Threads (phải dạng /post/xxxx)")
    target_code = m.group(1)
    print(f"→ Mã bài viết cần tìm: {target_code}")

    posts = []
    graphql_data = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        # --- Hàm bắt response ---
        def handle_response(response):
            if "graphql" in response.url and "postID" in response.url:
                try:
                    data = response.json()
                    if "reply_threads" in str(data) or "containing_thread" in str(data):
                        graphql_data.append(data)
                except Exception:
                    pass

        page.on("response", handle_response)
        page.goto(url)

        try:
            page.wait_for_selector("[data-pressable-container=true]", timeout=10000)
        except Exception:
            print("⚠️ Cảnh báo: Trang tải chậm hoặc không có selector bình luận, tiếp tục chờ dữ liệu mạng.")

        # Đợi thêm để toàn bộ GraphQL responses được tải
        for i in range(10):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1500)

        browser.close()

    print(f"✅ Bắt được {len(graphql_data)} phản hồi GraphQL chứa dữ liệu thread")

    if not graphql_data:
        raise ValueError("Không thu được dữ liệu GraphQL — có thể Threads thay đổi cấu trúc hoặc bài không có bình luận.")

    # --- Ghép dữ liệu GraphQL ---
    for gdata in graphql_data:
        threads = nested_lookup("thread_items", gdata)
        if not threads:
            continue
        for tlist in threads:
            for t in tlist:
                try:
                    post_data = parse_thread(t)
                    posts.append(post_data)
                except Exception:
                    continue

    # --- Loại trùng ---
    seen = set()
    unique_posts = []
    for p in posts:
        pid = p.get("id")
        if pid and pid not in seen:
            unique_posts.append(p)
            seen.add(pid)
    posts = unique_posts

    if not posts:
        raise ValueError("Không thể tìm thấy dữ liệu bài đăng trong phản hồi GraphQL.")

    # --- Cắt danh sách đúng số lượng mong muốn ---
    posts = posts[:target_total_posts]

    print(f"🎯 Đã thu được {len(posts)} bài đăng (bao gồm post chính và bình luận).")

    return {
        "thread": posts[0],
        "replies": posts[1:],
    }


def to_csv(data: dict, output):
    """
    Writes the scraped Threads post and replies to a CSV file.
    The main post's text is used as the 'title' column for all records.
    The fieldnames are harmonized to match the row dictionary keys: 'author', 'comment', 'title'.
    """
    
    # 1. Define the final fieldnames (column headers)
    # Corrected to match the keys used in the 'row' dictionary below
    fieldnames = ['author', 'comment', 'title']
    
    # 2. Extract the main post's text to be used as the 'title'
    thread_post = data.get('thread')
    if not thread_post:
        print("Warning: No thread data found to write.")
        return
        
    # Get the title from the main post's text
    title_text_raw = thread_post.get('text', 'N/A')
    title_text_clean = " ".join(title_text_raw.split())
    # 3. Prepare the data list (main post + replies)
    # Ensure all posts are included
    final_posts = [thread_post] + data.get('replies', [])
    final_data = []
    
    # Transformation loop to match data keys to desired fieldnames
    for post in final_posts:
        # Create a new dictionary for each row with the desired structure (author, comment, title)
        comment_text_raw = post.get('text', '')
        comment_text_clean = " ".join(comment_text_raw.split())

        row = {
            'author': post.get('username'), # 'author' maps to the source key 'username'
            'comment': comment_text_clean,    # 'comment' maps to the source key 'text'
            'title': title_text_clean             # The constant title for this thread
        }
        final_data.append(row)

    print(f"Writing {len(final_data)} record(s) to {output} with title: '{title_text_raw[:50]}...'")

    with open(output, 'a', newline='', encoding='UTF-8-sig') as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=fieldnames,
            # We use 'ignore' as a safety, though our data prep ensures keys match fieldnames
            extrasaction='ignore', 
            quoting=csv.QUOTE_ALL # Use QUOTE_ALL for text to handle internal commas
        )
        
        # Write the header row
        writer.writeheader()
        
        # Write all data rows
        writer.writerows(final_data)


# You would need to update the main function's print statement 
# and the argument parsing to reflect the updated purpose 
# (scraping Threads, not YouTube comments).

def main(argv=None):
    parser = argparse.ArgumentParser(add_help=False, description=('Scrape Threads post data and replies'))
    
    parser.add_argument('--link', '-lk', help='link of thread post') 
    parser.add_argument('--output', '-o', help='Output filename (output format is CSV)')
    parser.add_argument('--size', '-s', help="number of comments")
    # Removed '--size', '-s' as it's not used in the scraping logic

    args = parser.parse_args() if argv is None else parser.parse_args(argv)
    thread_link = args.link
    output = args.output
    size = int(args.size)

    if (not thread_link) or not output:
        parser.print_usage()
        # Changed the error message to be accurate for Threads
        raise ValueError('you need to specify a Threads link/URL and an output filename')

    data = scrape_thread(thread_link, size)
    to_csv(data, output)

if __name__ == "__main__":
    main()