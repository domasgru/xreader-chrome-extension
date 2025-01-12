import { useState, useEffect, useRef } from "react";
import { CSSObject } from "@emotion/react";
import GenerateSummaryButton from "./generate-summary-button";
import SummaryModal from "./summary-modal";
import { TIMELINE_WIDTH } from "./constants";
import IntroPopup from "./intro-popup";
import { motion } from "framer-motion";
import { useTweets } from "./context/tweets-context";
import Timeline from "./timeline";
import { getTimeLineElementNode } from "./helpers/twitter";
import { useLocalStorage } from "usehooks-ts";
import { usePreventScrollOnTwitter } from "./hooks/use-prevent-scroll-on-twitter";
import {
  UserPreferences,
  SummaryData,
  SummaryTextItemData,
  SummaryMediaItemData,
} from "./types";

const MOCK_SUMMARY = false;
const AI_API_URL = import.meta.env.VITE_AI_API_URL;

export default function AppContent() {
  const { tweets, loadMoreTweets, isLoadingTweets } = useTweets();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
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

  const [showIntroPopup, setShowIntroPopup] = useLocalStorage(
    "xReaderShowIntroPopup",
    true
  );

  const [userPreferences, setUserPreferences] =
    useLocalStorage<UserPreferences>("xReaderUserPreferences", {
      interests:
        "design, art, products, technology, self improvement, creating, building",
      notInterests: "jokes, memes, politics, religion, sports",
    });

  const appRootContainerRef = useRef<HTMLDivElement>(null);

  const preservedScrollPosition = useRef<number | null>(null);
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

  // Load initial tweets
  useEffect(() => {
    const timelineElement = getTimeLineElementNode();

    function loadInitialTweets() {
      loadMoreTweets(() => {
        if (!appRootContainerRef.current) {
          return false;
        }

        return (
          appRootContainerRef.current.scrollHeight -
            appRootContainerRef.current.scrollTop >
          5000
        );
      });
    }

    function initializeExtensionRetryFunction() {
      const timelineElement = getTimeLineElementNode();
      if (timelineElement instanceof HTMLElement) {
        clearInterval(timelineElementDetectionIntervalId);
        loadInitialTweets();
      }
    }

    let timelineElementDetectionIntervalId: any | null = null;
    if (timelineElement) {
      loadInitialTweets();
    } else {
      timelineElementDetectionIntervalId = setInterval(
        initializeExtensionRetryFunction,
        300
      );
    }
  }, []);

  // Prevent scroll on original twitter timeline
  usePreventScrollOnTwitter(appRootContainerRef);

  // Load more tweets on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!appRootContainerRef.current || isLoadingTweets) {
        return;
      }

      const { scrollHeight, scrollTop } = appRootContainerRef.current;
      if (scrollHeight - scrollTop > 5000) {
        return;
      }

      loadMoreTweets(() => {
        if (!appRootContainerRef.current) {
          return false;
        }

        return (
          appRootContainerRef.current.scrollHeight -
            appRootContainerRef.current.scrollTop >
          5000
        );
      });
    };

    const currentRef = appRootContainerRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isLoadingTweets]);

  return (
    <div ref={appRootContainerRef} css={styles.filteredTweetsContainerStyle}>
      <div css={styles.maxWidthContainer}>
        <motion.div
          layout
          layoutRoot
          css={{
            ...styles.sideContainer,
            ...(isLoadingSummary && {
              pointerEvents: "none",
            }),
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          {showIntroPopup && (
            <motion.div css={styles.introPopupContainer}>
              <IntroPopup
                userPreferences={userPreferences}
                setUserPreferences={setUserPreferences}
                onClose={() => setShowIntroPopup(false)}
              />
            </motion.div>
          )}
          {!showIntroPopup && (
            <GenerateSummaryButton
              isLoading={isLoadingSummary}
              onGenerate={() => generateSummary(1)}
              userPreferences={userPreferences}
              setUserPreferences={setUserPreferences}
            />
          )}
        </motion.div>
        <div css={styles.timelineContainer}>
          <Timeline tweets={tweets} />
        </div>
        <div css={styles.sideContainer} />
      </div>

      {isSummaryModalOpen && (
        <SummaryModal summaryData={summary} onClose={closeSummaryModal} />
      )}
    </div>
  );
}

const styles: Record<string, CSSObject> = {
  filteredTweetsContainerStyle: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "start",
    zIndex: 1,
    backgroundColor: "#000000",
    overflowY: "auto",
    overflowX: "hidden",
    fontFamily: "'TwitterChirp', sans-serif",
  },
  maxWidthContainer: {
    position: "relative",
    width: "1400px",
    maxWidth: "100%",
    display: "flex",
    alignItems: "start",
  },
  summaryContainer: {
    width: `${TIMELINE_WIDTH}px`,
  },
  introPopupContainer: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    zIndex: 1000,
    padding: "32px 16px",
  },
  sideContainer: {
    position: "sticky",
    top: "0",
    left: "0",
    height: "100vh",
    flex: "1 1 0px",
    minWidth: "0px",
    padding: "32px 16px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    zIndex: 100,
  },
  timelineContainer: {
    width: `${TIMELINE_WIDTH}px`,
    maxWidth: "100%",
    minWidth: "0px",
    flex: "0 1 auto",
    paddingTop: "20px",
  },
  timeline: {
    width: "100%",
    minWidth: "0px",
    borderTop: "1px solid #2F3336",
    borderLeft: "1px solid #2F3336",
    borderRight: "1px solid #2F3336",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 1,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 1000,
    width: "100%",
  },
  modalContent: {
    position: "sticky",
    top: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100vh",
  },
  modalImage: {
    maxWidth: "90%",
    maxHeight: "90vh",
    objectFit: "contain",
  },
};
