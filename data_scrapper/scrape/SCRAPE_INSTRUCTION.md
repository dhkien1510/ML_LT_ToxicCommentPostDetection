# thread
- Vào thread-comment-scrapper
- Gõ lệnh:
``` sh
python thread.py --link {thread_link} --size {number_of_comments} --output data/{filename.csv}
```
- Ví dụ:https://www.threads.com/@loanloanne/post/DQ2IrW8EqQ_?hl=en --> link = https://www.threads.com/@loanloanne/post/DQ2IrW8EqQ_?hl=en

# facebook

# youtube
- Vào youtube-comment-downloader/youtube_comment_downloader
- Gõ lệnh:
``` sh
python __main__.py --youtubeid {youtubeid} --limit {number_of_comments} --output data/{filename.csv}
```
- ví dụ:
https://www.youtube.com/watch?v=UsTDAnUsAlo --> youtubeid = UsTDAnUsAlo
- Các option về lệnh:
 --help, -h            Show this help message and exit
  --youtubeid YOUTUBEID, -y YOUTUBEID
                        ID of Youtube video for which to download the comments
  --url URL, -u URL     Youtube URL for which to download the comments
  --output OUTPUT, -o OUTPUT
                        Output filename (output format is line delimited JSON)
  --pretty, -p          Change the output format to indented JSON
  --limit LIMIT, -l LIMIT
                        Limit the number of comments
  --language LANGUAGE, -a LANGUAGE
                        Language for Youtube generated text (e.g. en)
  --sort SORT, -s SORT  Whether to download popular (0) or recent comments (1). Defaults to 1


# tiktok
- Vào thư mục tiktok-comment-scrapper
- gõ lệnh 
```sh
python main.py  --aweme_id {id_tiktok} --size {number_of_comments} --output data/{filename.csv}
```
- ví dụ: https://www.tiktok.com/@plxh.vn/video/7570050309083516191 --> aweme_id = 7570050309083516191
- Các options về args:
  --version        Show the version and exit.
  --aweme_id TEXT  id video tiktok (1 ID hoặc bỏ trống nếu dùng file)
  --output TEXT    directory output data
  --size INTEGER   Số lượng comment tối đa muốn lấy.
  --help           Show this message and exit.