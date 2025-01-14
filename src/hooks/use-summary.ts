import * as React from "react";
import {
  SummaryData,
  SummaryTextItemData,
  SummaryMediaItemData,
} from "../types";
import { useTweets } from "../context/tweets-context";
import { getUserPreferences } from "./use-user-preferences";

const MOCK_SUMMARY = false;
const AI_API_URL = import.meta.env.VITE_AI_API_URL;

export function useSummary() {
  const [summary, setSummary] = React.useState<SummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = React.useState(false);
  const { tweets, loadMoreTweets } = useTweets();

  const preservedScrollPosition = React.useRef<number | null>(null);
  function openSummaryModal() {
    preservedScrollPosition.current = window.scrollY;
    document.body.style.overflow = "hidden";
    setIsSummaryModalOpen(true);
  }
  function closeSummaryModal() {
    document.body.style.removeProperty("overflow");
    window.scrollTo(0, preservedScrollPosition.current || 0);
    preservedScrollPosition.current = null;
    setIsSummaryModalOpen(false);
  }

  async function generateSummary(forDays: number) {
    try {
      const isForYouTimeline = Array.from(
        document.getElementsByTagName("a")
      ).some(
        (link) =>
          link.textContent?.includes("For you") &&
          link.getAttribute("role") === "tab" &&
          link.getAttribute("aria-selected") === "true"
      );

      if (MOCK_SUMMARY) {
        // setIsLoadingSummary(true);
        // await new Promise((resolve) => setTimeout(resolve, 2000));
        // const mockSummary = await import("./data/mock-summary.json");
        // setSummary(mockSummary.default);
        // setIsLoadingSummary(false);
        // openSummaryModal();
        // return;
      }

      setIsLoadingSummary(true);
      const timeNow = new Date();
      const twentyFourHoursAgo = new Date(
        Date.now() - forDays * 24 * 60 * 60 * 1000
      );
      await loadMoreTweets(() => {
        if (tweets.length > 1500) {
          return true;
        }

        if (isForYouTimeline) {
          if (tweets.length > 300) {
            return true;
          }
        } else {
          const hasReachedTargetTweet = tweets.some((tweet) => {
            if (
              new Date(tweet.createdAt) <= twentyFourHoursAgo &&
              tweet.retweetAuthor === null &&
              !tweet.hasReplies
            ) {
              return true;
            }
          });

          return hasReachedTargetTweet;
        }

        return false;
      });

      const tweetsSnapshot = [...tweets];

      const processedPosts = tweetsSnapshot
        .filter((tweet) => tweet.textContent)
        .map(({ id, textContent, authorName }) => ({
          postText: textContent,
          postAuthor: authorName,
          postId: id,
        }));

      const userPreferences = getUserPreferences();

      const response = await fetch(AI_API_URL, {
        method: "POST",
        body: JSON.stringify({
          interests: userPreferences.interests,
          notInterests: userPreferences.notInterests,
          stringifiedPosts: JSON.stringify(processedPosts),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const summaryItems: { description: string; relatedPostsIds: string[] }[] =
        (await response.json()).response.items;
      const writtenSummaryItems: SummaryTextItemData[] = summaryItems?.map(
        (item) => {
          return {
            text: item.description,
            relatedTweets: item.relatedPostsIds
              .map((id) => tweetsSnapshot.find((tweet) => tweet.id === id))
              .filter((tweet) => tweet !== undefined),
          };
        }
      );
      const media: SummaryMediaItemData[] = tweetsSnapshot.reduce(
        (acc: SummaryData["mediaItems"], tweet) => {
          if (tweet.images && tweet.images.length > 0) {
            const existingAuthor = acc.find(
              (item) => item.authorName === tweet.authorName
            );
            if (existingAuthor) {
              existingAuthor.images.push(
                ...tweet.images.map((image) => ({
                  imageUrl: image,
                  tweetText: tweet.textContent,
                  tweetId: tweet.id,
                  tweetLink: tweet.url,
                }))
              );
            } else {
              acc.push({
                authorName: tweet.authorName,
                authorProfileImage: tweet.authorProfileImage,
                images: [
                  ...tweet.images.map((image) => ({
                    imageUrl: image,
                    tweetText: tweet.textContent,
                    tweetId: tweet.id,
                    tweetLink: tweet.url,
                  })),
                ],
              });
            }
          }
          return acc;
        },
        []
      );

      // Calculate timeTo
      const tweetsTimes = tweetsSnapshot
        .filter((tweet) => tweet.retweetAuthor === null && !tweet.hasReplies)
        .map((tweet) => tweet.createdAt);
      const oldestTweetTime = new Date(
        Math.min(...tweetsTimes.map((time) => Date.parse(time)))
      );
      const timeTo = isForYouTimeline ? oldestTweetTime : twentyFourHoursAgo;

      const summary: SummaryData = {
        textItems: writtenSummaryItems,
        timeFrom: timeNow.toISOString(),
        timeTo: timeTo.toISOString(),
        mediaItems: media,
      };

      setSummary(summary);
      openSummaryModal();
    } catch (e) {
      console.error("Error generating summary:", e);
    } finally {
      setIsLoadingSummary(false);
    }
  }

  return {
    summary,
    isLoadingSummary,
    isSummaryModalOpen,
    generateSummary,
    openSummaryModal,
    closeSummaryModal,
  };
}
