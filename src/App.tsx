/// <reference types="chrome"/>
import { useState, useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import emotionReset from 'emotion-reset';
import Tweet from './Tweet';
import { TweetInterface } from './TweetInterface';

function getTimeLineElementNode() {
  const timelineElement = document.querySelector<HTMLElement>('[aria-label="Timeline: Your Home Timeline"]');
  if (timelineElement && timelineElement.firstChild instanceof Node) {
    return timelineElement.firstChild;
  }
  return null;
}

function getAllHrefs(node: Element) {
  try {
    const hrefs = new Set();
    const anchors = node.querySelectorAll('a');  // Select all <a> tags within the provided node

    anchors.forEach(anchor => {
      if (anchor.href) {
        hrefs.add(anchor.href);
      }
    });

    return Array.from(hrefs);  // Convert Set to array
  } catch (error) {
    console.log(error)
  }
}

function getAllTextNodes(node: HTMLElement) {
  const textNodes = [];
  const xpathResult = document.evaluate(
    './/text()[normalize-space()]',
    node,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (let i = 0; i < xpathResult.snapshotLength; i++) {
    textNodes.push(xpathResult.snapshotItem(i));
  }

  return textNodes;
}

function parseTweetNode(node: Element): TweetInterface | null {
  try {
    const tweetTime = node.querySelector<HTMLTimeElement>('time')?.dateTime;

    // Not a tweet element, but inside a timeline
    if (!tweetTime) {
      return null;
    }

    const allLinks = getAllHrefs(node as HTMLElement);
    const tweetTexts = node.querySelectorAll<HTMLElement>('[data-testid="tweetText"]');

    // Handle quoted tweets
    const quoteElement = document.evaluate(".//*[text()='Quote']", node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)?.singleNodeValue as Element;
    const isQuotedTweet = !!quoteElement && !quoteElement.closest('[data-testid="tweetText"]')
    const quoteTweetElement = isQuotedTweet && quoteElement?.parentElement?.nextElementSibling;
    //debugger
    const quotedTweet = quoteTweetElement ? parseTweetNode(quoteTweetElement) : null;

    // Handle retweets
    const retweetAuthor = node.querySelector<HTMLElement>('[data-testid="socialContext"]')?.textContent?.split(' ')[0] || null;

    // Handle tweet videos
    const tweetVideoPosters = Array.from(node.querySelectorAll<HTMLVideoElement>('video')).map(video => {
      if (quoteTweetElement && quoteTweetElement.contains(video)) {
        return null;
      }

      return video?.poster;
    }).filter(src => src !== null);

    // Handle images
    const tweetImages = Array.from(node.querySelectorAll<HTMLImageElement>('[data-testid="tweetPhoto"] img')).map(img => {
      if (quoteTweetElement && quoteTweetElement.contains(img)) {
        return null;
      }

      return img?.src;
      // Sometimes tweet with videos has duplicate image of a poster
    }).filter(src => src !== null).filter(src => !tweetVideoPosters.includes(src));

    // Handle long text tweets
    const showMoreElement = node.querySelector<HTMLElement>('[data-testid="tweet-text-show-more-link"]');
    let hasShowMore = false;
    if (showMoreElement) {
      if (quoteTweetElement && quoteTweetElement.contains(showMoreElement)) {
        hasShowMore = false;
      } else {
        hasShowMore = true;
      }
    }

    // Handle link card
    const linkCardLinkElement = node.querySelector<HTMLAnchorElement>('[data-testid="card.wrapper"] a');
    const tweetLinkCard = linkCardLinkElement?.href ? {
      linkCardUrl: linkCardLinkElement.href,
      linkCardImage: linkCardLinkElement.querySelector<HTMLImageElement>('img')?.src,
      linkCardLink: linkCardLinkElement.querySelector<HTMLAnchorElement>('a')?.href,
      linkCardTitle: linkCardLinkElement.textContent || undefined,
    } : undefined;

    // Handle user details
    const profileImage = node.querySelector<HTMLImageElement>('[data-testid="Tweet-User-Avatar"] img')?.src;
    const profileElement = node.querySelector<HTMLElement>('[data-testid="User-Name"]');
    const profileTextNodes = profileElement ? getAllTextNodes(profileElement) : null;
    const profileName = profileTextNodes?.[0]?.textContent?.trim();
    const profileTag = profileTextNodes?.[1]?.textContent?.trim();

    const hasReplies = window.getComputedStyle(node.firstChild as HTMLElement).borderBottom[0] === '0' ? true : false;

    const id = node.querySelector<HTMLTimeElement>('time')?.dateTime + ((retweetAuthor || profileName)?.split(' ').join('') || '');

    if (id === '2024-09-26T03:00:13.000Zinteriorstellar') {
      console.log("images", tweetImages);
    }

    const tweetData: TweetInterface = {
      retweetAuthor,
      hasShowMore,
      tweetText: tweetTexts[0]?.textContent || undefined,
      tweetLink: (allLinks as string[])?.find(link => link.includes('/status/')) ?? '',
      tweetImages,
      tweetVideoPosters,
      tweetLinkCard,
      quotedTweet,
      tweetTime,
      profileName,
      profileTag,
      profileImage,
      hasReplies,
      id: node.querySelector<HTMLTimeElement>('time')?.dateTime + ((retweetAuthor || profileName)?.split(' ').join('') || ''),
      debugData: {
        nodeHtml: node.innerHTML,
      }
    };

    //console.log('tweetData', tweetData);

    return tweetData;
  } catch (error) {
    console.log('Error processing node', error);
    return null;
  }
}

function getUniqueTweets(tweets: TweetInterface[]): TweetInterface[] {
  const seen = new Set();
  return tweets.filter(item => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return true;
    }
    return false;
  });
}

function preventScrollOutsideExtentionUIEventListener(e: WheelEvent) {
  if (!(e.target as HTMLElement)?.closest('#ai-reader-root')) {
    e.preventDefault();
  }
}

function updateTweetsWithoutDuplicates(prevTweets: TweetInterface[], newTweets: TweetInterface[]): TweetInterface[] {
  const uniqueTweets = [...prevTweets];
  const tweetIds = new Set(prevTweets.map(tweet => tweet.id));

  newTweets.forEach(newTweet => {
    const existingIndex = uniqueTweets.findIndex(tweet => tweet.id === newTweet.id);
    if (existingIndex !== -1) {
      uniqueTweets[existingIndex] = { ...newTweet };
    } else if (!tweetIds.has(newTweet.id)) {
      uniqueTweets.push({ ...newTweet });
      tweetIds.add(newTweet.id);
    }
  });

  return [...uniqueTweets]; // Return a new array reference
}

function App() {
  const [filteredTweets, setFilteredTweets] = useState<TweetInterface[]>([]);
  const [isLoadingTweets, setIsLoadingTweets] = useState<boolean>(false);
  const filteredTweetsContainerRef = useRef<HTMLDivElement>(null);

  function observeTimelineAndLoadTweets(timelineElement: HTMLElement) {
    let observedTweets: TweetInterface[] = [];
    const timelineTweetsObserver = new MutationObserver(async (mutations: MutationRecord[]) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await new Promise(resolve => requestAnimationFrame(resolve));

      const newTweets = mutations.reduce<TweetInterface[]>((acc, mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node: Node) => {
            if (node instanceof Element) {
              const tweetData = parseTweetNode(node);
              if (tweetData) {
                acc.push(tweetData);
              }
            }
          });
        }
        return acc;
      }, []);

      observedTweets = [...observedTweets, ...newTweets];

      if (observedTweets.length >= 20) {
        const tweetsToAdd = [...observedTweets];
        console.log('Observer found more than 20 tweets', tweetsToAdd);
        setFilteredTweets(prevTweets => {
          const uniqueTweets = getUniqueTweets([...prevTweets, ...tweetsToAdd]);
          console.log('Observer added unique tweets to state', uniqueTweets);
          console.log('filteredTweets', filteredTweets);
          return uniqueTweets;
        });

        observedTweets = [];
      }
    });

    timelineTweetsObserver.observe(timelineElement, { childList: true });

    return timelineTweetsObserver;
  }

  function loadTimelineTweets() {

  }

  // Initialize chrome extension
  useEffect(() => {
    // Initialize timeLineObserver
    let timelineTweetsObserver: any | null = null;
    const timelineElement = getTimeLineElementNode();

    function initializeExtension(timelineElement: HTMLElement) {
      function preventScrollOnTimeline(e: WheelEvent) {
        const { scrollTop, scrollHeight, clientHeight } = filteredTweetsContainerRef.current as HTMLElement;

        // Check if user scrolling at the top or bottom of the scroll
        if ((scrollTop <= 0 && (e as WheelEvent).deltaY < 0) || (Math.round(scrollTop + clientHeight) >= scrollHeight && (e as WheelEvent).deltaY > 0)) {
          e.preventDefault();
        }
      }
      document.addEventListener('wheel', preventScrollOutsideExtentionUIEventListener, { passive: false });
      (document.querySelector('#ai-reader-root') as HTMLElement)?.addEventListener('wheel', preventScrollOnTimeline, { passive: false });

      // Set initial tweets
      if (filteredTweets.length === 0) {
        const initialTweets = Array.from(timelineElement.childNodes).map(node => parseTweetNode(node as Element)).filter(tweet => tweet !== null);
        setFilteredTweets(initialTweets);
      }

      // Observe timeline for new tweets
      //timelineTweetsObserver = observeTimelineAndLoadTweets(timelineElement);
    }

    function initializeExtensionRetryFunction() {
      const timelineElement = getTimeLineElementNode();
      if (timelineElement instanceof HTMLElement) {
        clearInterval(timelineElementDetectionIntervalId);

        initializeExtension(timelineElement);

        console.log('Timeline element found and observation started');
      } else {
        console.log('Timeline element not found, retrying...');
      }
    }

    let timelineElementDetectionIntervalId: any | null = null;
    if (timelineElement) {
      initializeExtension(timelineElement as HTMLElement);
    } else {
      timelineElementDetectionIntervalId = setInterval(initializeExtensionRetryFunction, 300);
    }

    return () => {
      console.log('unmounting');
      clearInterval(timelineElementDetectionIntervalId);
      document.removeEventListener('wheel', preventScrollOutsideExtentionUIEventListener);
      if (typeof timelineTweetsObserver !== 'undefined' && timelineTweetsObserver) {
        timelineTweetsObserver.disconnect();
      }

    };
  }, []);

  // Load more tweets on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!filteredTweetsContainerRef.current || isLoadingTweets) {
        return;
      }

      const { scrollHeight, scrollTop } = filteredTweetsContainerRef.current;
      if (scrollHeight - scrollTop > 5000) {
        return;
      }

      setIsLoadingTweets(true);

      let scrollIntervalId: any | null = null;
      let tweetsToAdd: TweetInterface[] = [];
      async function loadMoreTweetsSetIntervalFunction() {
        console.log('------INITIALIZED FUNCTION TO LOAD TWEETS-------', filteredTweetsContainerRef.current?.scrollHeight, filteredTweetsContainerRef.current?.scrollTop)
        if (!filteredTweetsContainerRef.current) {
          setIsLoadingTweets(false);
          return clearInterval(scrollIntervalId);
        }

        if (filteredTweetsContainerRef.current.scrollHeight - filteredTweetsContainerRef.current.scrollTop > 5000) {
          setIsLoadingTweets(false);
          return clearInterval(scrollIntervalId);
        }

        window.scrollBy(0, window.innerHeight); console.log('--Scrolling window');
        await new Promise(resolve => setTimeout(resolve, 150));
        //await new Promise(resolve => requestAnimationFrame(resolve));
        const renderedTweets = Array.from(getTimeLineElementNode()?.childNodes || []).map(node => parseTweetNode(node as Element)).filter(tweet => tweet !== null);
        const visibleTweets = renderedTweets.length > 12 ? renderedTweets.slice(3, -3) : renderedTweets;
        tweetsToAdd = updateTweetsWithoutDuplicates(tweetsToAdd, visibleTweets); console.log('--Found after scroll', tweetsToAdd);
        if (tweetsToAdd.length > 20) {
          const tweetsToAddCopy = [...tweetsToAdd]; console.log('--Adding to state', tweetsToAddCopy);
          setFilteredTweets(prevTweets => {
            const uniqueTweets = getUniqueTweets([...prevTweets, ...tweetsToAddCopy]);
            return uniqueTweets;
          });
          tweetsToAdd = [];
        }
      }
      if (!scrollIntervalId) {
        scrollIntervalId = setInterval(loadMoreTweetsSetIntervalFunction, 200);
      }

    };

    const currentRef = filteredTweetsContainerRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    // Cleanup function
    return () => {
      console.log('unmounting scroll', currentRef)
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isLoadingTweets, filteredTweetsContainerRef]);

  return (
    <>
      <Global styles={css`
        ${emotionReset}

        *, *::after, *::before {
          box-sizing: border-box;
          -moz-osx-font-smoothing: grayscale;
          -webkit-font-smoothing: antialiased;
          font-smoothing: antialiased;
        }
      `} />
      <div ref={filteredTweetsContainerRef} css={css`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        z-index: 999999999;
        background-color: rgba(0, 0, 0, 1); 
        //backdrop-filter: blur(200px);
        overflow-y: scroll;
        padding: 20px;
        font-family: 'TwitterChirp', sans-serif;
      `}>
        <div css={css`
          padding: 0; 
          width: 646px;
          max-width: 100%;
          color: black;
          border-left: 1px solid #2F3336;
          border-right: 1px solid #2F3336;
          display: flex;
          flex-direction: column;
          align-items: center;
        `}>
          {filteredTweets.map((tweet) => (
            <Tweet key={tweet.id} tweet={tweet} isQuote={false} />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
