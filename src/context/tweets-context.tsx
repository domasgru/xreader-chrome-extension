import { createContext, useContext, useRef, useState } from "react";
import { TweetData } from "../types";
import {
  getUniqueTweets,
  getTimeLineElementNode,
  parseTweetElement,
} from "../helpers/twitter";

interface TweetsContextType {
  tweets: TweetData[];
  isLoadingTweets: boolean;
  setTweets: (
    tweets: TweetData[] | ((prevTweets: TweetData[]) => TweetData[])
  ) => void;
  addTweets: (tweets: TweetData[]) => void;
  loadMoreTweets: (shouldStopLoadingFunction: () => boolean) => Promise<void>;
  setIsLoadingTweets: (isLoadingTweets: boolean) => void;
  loadMoreTweetsAbortController: React.MutableRefObject<AbortController | null>;
}

const TweetsContext = createContext<TweetsContextType | undefined>(undefined);

//const MOCK_TWEETS = false;
const WAIT_AFTER_SCROLL = 200;

export function TweetsProvider({ children }: { children: React.ReactNode }) {
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [isLoadingTweets, setIsLoadingTweets] = useState(false);

  function addTweets(tweets: TweetData[]) {
    // Add tweets function might be called with already existing tweets,
    // so we need to get unique tweets
    setTweets((prevTweets) => getUniqueTweets([...prevTweets, ...tweets]));
  }

  const loadMoreTweetsAbortController = useRef<AbortController | null>(null);
  //const lastSavedTimelineElementChildNode = useRef<HTMLElement | null>(null);
  async function loadMoreTweets(
    shouldStopLoadingFunction: () => boolean
  ): Promise<void> {
    return new Promise(async (resolve) => {
      // if (MOCK_TWEETS) {
      //   const mockTweets = await import("../data/mock-tweets.json");
      //   setTweets(mockTweets.default.slice(0, 10) as TweetData[]);
      //   return resolve();
      // }

      // If there is no timeline element
      const timelineElement = getTimeLineElementNode();
      if (!timelineElement) {
        return;
      }

      // If another loadMoreTweets is running, abort it, and wait for it to completely finish
      if (loadMoreTweetsAbortController.current) {
        loadMoreTweetsAbortController.current.abort();
        while (loadMoreTweetsAbortController.current) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      loadMoreTweetsAbortController.current = new AbortController();
      setIsLoadingTweets(true);

      try {
        let lastSavedTimelineElementChildNode: HTMLElement | null = null;

        while (
          !shouldStopLoadingFunction() &&
          !loadMoreTweetsAbortController.current.signal.aborted
        ) {
          if (lastSavedTimelineElementChildNode) {
            lastSavedTimelineElementChildNode.scrollIntoView();
            await new Promise((resolve) =>
              setTimeout(resolve, WAIT_AFTER_SCROLL)
            );
          }

          if (loadMoreTweetsAbortController.current.signal.aborted) {
            break;
          }

          const renderedTweetsArray = Array.from(timelineElement.childNodes);
          const parseFromIndex = lastSavedTimelineElementChildNode
            ? renderedTweetsArray.findIndex(
                (node) => node === lastSavedTimelineElementChildNode
              ) + 1
            : 0;
          const parseToIndex = renderedTweetsArray.length - 1;
          const arrayToParse = renderedTweetsArray.slice(
            parseFromIndex,
            parseToIndex
          );
          const parsedTweets = arrayToParse
            .map((node) => parseTweetElement(node as Element))
            .filter((tweet) => tweet !== null);
          addTweets([...parsedTweets]);

          lastSavedTimelineElementChildNode = renderedTweetsArray[
            parseToIndex
          ] as HTMLElement;
        }
      } catch (error) {
        console.error("Error in loadMoreTweets:", error);
      } finally {
        setIsLoadingTweets(false);
        loadMoreTweetsAbortController.current = null;
        resolve();
      }
    });
  }

  return (
    <TweetsContext.Provider
      value={{
        tweets,
        setTweets,
        addTweets,
        loadMoreTweets,
        isLoadingTweets,
        setIsLoadingTweets,
        loadMoreTweetsAbortController,
      }}
    >
      {children}
    </TweetsContext.Provider>
  );
}

export function useTweets() {
  debugger;
  const context = useContext(TweetsContext);
  if (!context) {
    throw new Error("useTweets must be used within a TweetsProvider");
  }
  return context;
}
