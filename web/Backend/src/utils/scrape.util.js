import axios from "axios";
import { scrapeTikTokComments } from "../services/tiktok.service.js";
import { scrapeThreadsComments } from "../services/thread.service.js";

export const scrapeCommentsFromUrl = async (url) => {
  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  // ===== THREADS =====
  if (url.includes("threads.com")) {
    return await scrapeThreadsComments(url);
  }

  // ===== TIKTOK =====
  if (url.includes("tiktok.com")) {
    return await scrapeTikTokComments(url);
  }

  throw new Error("Unsupported URL");
};
