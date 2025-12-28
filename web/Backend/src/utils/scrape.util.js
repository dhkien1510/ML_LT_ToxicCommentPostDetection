// import { ApifyClient } from "apify-client";
// import dotenv from "dotenv";

// dotenv.config({ path: "./src/.env" });

// export async function scrapeCommentsFromUrl(postUrl) {
//   const client = new ApifyClient({
//     token: process.env.APIFY_TOKEN,
//   });

//   const input = {
//     startUrls: [{ url: postUrl }],
//     maxComments: 1000,
//     includeNestedComments: true,
//     commentsOrder: "RANKED_UNFILTERED",
//     proxyConfiguration: { useApifyProxy: true }
//   };


//   const run = await client.actor("apify/facebook-comments-scraper").call(input);

//   const { items } = await client.dataset(run.defaultDatasetId).listItems();

//   // chỉ lấy text
//   const comments = items.map(item => item.text).filter(Boolean);
//   console.log("Total comments:", comments.length);

//   return comments;
// }

import axios from "axios";
import https from "https";

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 5,
});

export async function scrapeCommentsFromUrl(postUrl) {
  const url = postUrl.endsWith("/")
    ? postUrl + ".json?limit=500"
    : postUrl + "/.json?limit=500";

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.get(url, {
        httpsAgent: agent,
        timeout: 15000,
        headers: {
          "User-Agent": "webdev-student:v1.0 (by u/yourusername)",
        },
      });

      
      if (!Array.isArray(res.data) || res.data.length < 2) {
        return [];
      }
      
      const comments = [];
      const listing = res.data[1]?.data?.children || [];
      
      console.log(listing);

      function extract(list) {
        for (const item of list) {
          if (item.kind === "t1" && item.data?.body) {
            comments.push(item.data.body);

            const replies = item.data.replies?.data?.children;
            if (Array.isArray(replies)) {
              extract(replies);
            }
          }
        }
      }

      extract(listing);

      console.log("Total comments:", comments.length);

      return comments;

    } catch (err) {
      console.warn(`Attempt ${attempt} failed:`, err.code || err.message);

      if (attempt === 3) {
        throw err;
      }

      // exponential backoff
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
}
