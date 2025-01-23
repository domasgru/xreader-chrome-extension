import * as React from "react";
import { TweetData } from "../types";
import {
  getUniqueTweets,
  getTimeLineElementNode,
  parseTweetElement,
} from "../helpers/twitter";

interface TweetsContextType {
  tweetsRef: React.MutableRefObject<TweetData[]>;
  tweets: TweetData[];
  isLoadingTweets: boolean;
  addTweets: (tweets: TweetData[]) => void;
  loadMoreTweets: (shouldStopLoadingFunction: () => boolean) => Promise<void>;
  setIsLoadingTweets: (isLoadingTweets: boolean) => void;
}

const TweetsContext = React.createContext<TweetsContextType | undefined>(
  undefined
);

//const MOCK_TWEETS = false;
const WAIT_AFTER_SCROLL = 200;

export function TweetsProvider({ children }: { children: React.ReactNode }) {
  const [tweets, setTweets] = React.useState<TweetData[]>([]);
  const tweetsRef = React.useRef<TweetData[]>([]);
  const [isLoadingTweets, setIsLoadingTweets] = React.useState(false);

  function addTweets(tweets: TweetData[]) {
    tweetsRef.current = getUniqueTweets([...tweetsRef.current, ...tweets]);
    setTweets(tweetsRef.current);
  }

  const loadMoreTweetsAbortController = React.useRef<AbortController | null>(
    null
  );

  async function loadMoreTweets(
    shouldStopLoadingFunction: () => boolean
  ): Promise<void> {
    // if (MOCK_TWEETS) {
    //   const mockTweets = await import("../data/mock-tweets.json");
    //   addTweets(mockTweets.default.slice(0, 10) as TweetData[]);
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
        !loadMoreTweetsAbortController.current?.signal.aborted
      ) {
        if (lastSavedTimelineElementChildNode) {
          lastSavedTimelineElementChildNode.scrollIntoView();
          await new Promise((resolve) =>
            setTimeout(resolve, WAIT_AFTER_SCROLL)
          );
        }

        if (loadMoreTweetsAbortController.current?.signal.aborted) {
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
        addTweets(parsedTweets);

        lastSavedTimelineElementChildNode = renderedTweetsArray[
          parseToIndex
        ] as HTMLElement;
      }
    } catch (error) {
      console.error("Error in loadMoreTweets:", error);
    } finally {
      setIsLoadingTweets(false);
      loadMoreTweetsAbortController.current = null;
    }
  }

  React.useEffect(() => {
    return () => {
      loadMoreTweetsAbortController.current = null;
    };
  }, []);

  return (
    <TweetsContext.Provider
      value={{
        tweetsRef,
        tweets,
        addTweets,
        loadMoreTweets,
        isLoadingTweets,
        setIsLoadingTweets,
      }}
    >
      {children}
    </TweetsContext.Provider>
  );
}

export function useTweets() {
  const context = React.useContext(TweetsContext);
  if (!context) {
    throw new Error("useTweets must be used within a TweetsProvider");
  }
  return context;
}
