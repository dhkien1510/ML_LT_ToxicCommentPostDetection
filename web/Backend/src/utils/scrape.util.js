import { ApifyClient } from "apify-client";
import dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

export async function scrapeCommentsFromUrl(postUrl) {
  const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
  });

  const input = {
    startUrls: [{ url: postUrl }],
    maxComments: 500,       // lấy bao nhiêu comment
    includeNestedComments: true,
    commentsOrder: "RANKED_UNFILTERED"
  };

  const run = await client.actor("apify/facebook-comments-scraper").call(input);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  // chỉ lấy text
  const comments = items.map(item => item.text).filter(Boolean);

  console.log("Total comments:", comments.length);

  return comments;
}
