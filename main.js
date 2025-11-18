import {ClickStories} from "./display/event-click-stories.js";
import {ClickJobs} from "./display/event-click-jobs.js";
import {News} from "./display/default-news.js";
import {ClickPolls} from "./display/event-click-polls.js";

async function displayNews() {
  // Base URLs
  let globalUrl = `https://hacker-news.firebaseio.com/v0/item/`;
  let storyUrl = `https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty`;
  let jobUrl = `https://hacker-news.firebaseio.com/v0/jobstories.json?print=pretty`;

  // Initialize all sections
  ClickStories(".h1stories", ".stories", globalUrl, storyUrl);
  ClickJobs(".h1jobs", ".jobs", globalUrl, jobUrl);
  ClickPolls(".h1polls", ".polls", globalUrl); // No more hardcoded IDs!
  
  // Display live news (initial load)
  News(".last-news", globalUrl);
  
  // Update live news every 5 seconds
  setInterval(() => {
    News(".last-news", globalUrl);
  }, 5000);
}

displayNews();