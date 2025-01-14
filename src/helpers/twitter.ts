import { TweetData } from "../types";
import { getAllHrefs, getAllTextNodes } from "./dom";
import { stringToId } from "../utils/string-to-id";

export function parseTweetElement(element: Element): TweetData | null {
  try {
    const hasReplies =
      window.getComputedStyle(element.firstChild as Element)
        .borderBottomWidth === "0px"
        ? true
        : false;
    const clonedNode = element.cloneNode(true) as Element;

    const createdAt = clonedNode.querySelector("time")?.dateTime;

    // Not a tweet element
    if (!createdAt) {
      return null;
    }

    const allLinks = getAllHrefs(clonedNode);
    const tweetTexts = clonedNode.querySelectorAll('[data-testid="tweetText"]');

    // Handle tweet quotes
    const tweetQuoteIndicatorElement = document.evaluate(
      ".//*[text()='Quote']",
      clonedNode,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )?.singleNodeValue as Element;
    const isQuotedTweet =
      !!tweetQuoteIndicatorElement &&
      !tweetQuoteIndicatorElement.closest('[data-testid="tweetText"]');
    const tweetQuoteElement =
      isQuotedTweet &&
      tweetQuoteIndicatorElement?.parentElement?.nextElementSibling;
    const tweetQuote = tweetQuoteElement
      ? parseTweetElement(tweetQuoteElement) ?? undefined
      : undefined;

    // Handle retweets
    const retweetAuthorElement = clonedNode.querySelector(
      '[data-testid="socialContext"]'
    );
    const retweetAuthor = retweetAuthorElement
      ? getAllTextNodes(retweetAuthorElement)?.[0]?.nodeValue ?? undefined
      : undefined;

    // Handle tweet videos
    const videos = Array.from(clonedNode.querySelectorAll("video"))
      .map((video) => {
        if (tweetQuoteElement && tweetQuoteElement.contains(video)) {
          return null;
        }

        return {
          poster: video.poster,
          url: video.src,
        };
      })
      .filter((src) => src !== null);

    // Handle images
    const images = Array.from(
      clonedNode.querySelectorAll<HTMLImageElement>(
        '[data-testid="tweetPhoto"] img'
      )
    )
      .map((img) => {
        if (tweetQuoteElement && tweetQuoteElement.contains(img)) {
          return null;
        }

        return img?.src;
      })
      .filter((src) => src !== null)
      .filter((src) => !videos.some((video) => video?.poster === src));

    // Handle long text tweets
    const showMoreElement = clonedNode.querySelector(
      '[data-testid="tweet-text-show-more-link"]'
    );
    let hasShowMore = false;
    if (showMoreElement) {
      if (tweetQuoteElement && tweetQuoteElement.contains(showMoreElement)) {
        hasShowMore = false;
      } else {
        hasShowMore = true;
      }
    }

    // Handle link card
    const linkCardElement = clonedNode.querySelector<HTMLAnchorElement>(
      '[data-testid="card.wrapper"] a'
    );
    const linkCard = linkCardElement?.href
      ? {
          linkCardUrl: linkCardElement.href,
          linkCardImage: linkCardElement.querySelector("img")?.src,
          linkCardLink: linkCardElement.querySelector("a")?.href,
          linkCardTitle: linkCardElement.textContent || undefined,
        }
      : undefined;

    // Handle user details
    const authorProfileImage = clonedNode.querySelector<HTMLImageElement>(
      '[data-testid="Tweet-User-Avatar"] img'
    )?.src;
    const authorElement = clonedNode.querySelector('[data-testid="User-Name"]');
    const authorTextNodes = authorElement
      ? getAllTextNodes(authorElement)
      : null;
    const authorName = authorTextNodes?.[0]?.textContent?.trim() || "";
    const authorTag = authorTextNodes?.[1]?.textContent?.trim() || "";

    const textContent = tweetTexts[0]?.textContent || "";

    const tweetUniqueString =
      clonedNode.querySelector("time")?.dateTime +
      ((retweetAuthor || authorName)?.split(" ").join("") || "") +
      textContent?.slice(0, 5)?.trim();
    const id = stringToId(tweetUniqueString);

    const tweetData: TweetData = {
      retweetAuthor,
      hasShowMore,
      textContent,
      url:
        (allLinks as string[])?.find((link) => link.includes("/status/")) ?? "",
      images,
      videos,
      linkCard,
      tweetQuote,
      createdAt,
      authorName,
      authorTag,
      authorProfileImage,
      hasReplies,
      id,
    };

    return tweetData;
  } catch (error) {
    console.log("Error processing node", error);
    return null;
  }
}

export function getTimeLineElementNode() {
  const timelineElement = document.querySelector<HTMLElement>(
    '[aria-label="Timeline: Your Home Timeline"]'
  );
  if (timelineElement && timelineElement.firstChild) {
    return timelineElement.firstChild as Element;
  }
  return null;
}

export function getUniqueTweets(tweets: TweetData[]): TweetData[] {
  const seen = new Set();
  return tweets.filter((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return true;
    }
    return false;
  });
}
