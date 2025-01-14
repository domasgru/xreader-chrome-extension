import * as React from "react";
import { getTimeLineElementNode } from "../helpers/twitter";
import { useTweets } from "../context/tweets-context";

export function useLoadTweets(
  appRootContainerRef: React.RefObject<HTMLElement>
) {
  const { loadMoreTweets, isLoadingTweets } = useTweets();

  // Load initial tweets
  React.useEffect(() => {
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

  // Load more tweets on scroll
  React.useEffect(() => {
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
}
