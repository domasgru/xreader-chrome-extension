/// <reference types="chrome"/>
import { useState, useEffect, useRef } from 'react';
import { css } from '@emotion/react';

interface Tweet {
  isRetweet: boolean;
  tweetText?: string;
  tweetLink: string;
  tweetImages: string[];
  tweetVideos: string[];
  tweetTime: string;
  profileName?: string,
  profileTag?: string,
  profileImage?: string;
  id: string;
}

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

function parseTweetNode(node: Element): Tweet | null {
  try {
    const allLinks = getAllHrefs(node as HTMLElement);
    const allTextNodes = getAllTextNodes(node as HTMLElement);

    const tweetTime = node.querySelector<HTMLTimeElement>('time')?.dateTime;
    if (!tweetTime) {
      return null;
    }

    const tweetData: Tweet = {
      // TODO: handle retweets which have multiple texts
      isRetweet: allTextNodes[1]?.nodeValue?.includes('reposted') || false,
      tweetText: node.querySelector<HTMLElement>('[data-testid="tweetText"]')?.innerText,
      tweetLink: (allLinks as string[])?.find(link => link.includes('/status/')) ?? null,
      tweetImages: Array.from(node.querySelectorAll('img'))?.map(img => img?.src).filter(src => !src?.includes('/profile_images/') && !src?.includes('.svg')),
      tweetVideos: Array.from(node.querySelectorAll('video'))?.map(video => video?.src || video.poster),
      tweetTime,
      profileName: allTextNodes[0]?.nodeType === Node.TEXT_NODE ? (allTextNodes[0] as Text).data : undefined,
      profileTag: allTextNodes[1]?.nodeType === Node.TEXT_NODE ? (allTextNodes[1] as Text).data : undefined,
      profileImage: Array.from(node.querySelectorAll('img'))?.map(img => img?.src).find(src => src?.includes('/profile_images/')),
      id: node.querySelector<HTMLTimeElement>('time')?.dateTime + (node.textContent?.substring(0, 10) ?? '')
    };

    return tweetData;
  } catch (error) {
    console.log('Error processing node', error);
    return null;
  }
}

function getDefaultTweetsUntilData(): string {
  const date = new Date();
  date.setHours(date.getHours() - 24);
  return date.toISOString();
}

function getUniqueTweets(tweets: Tweet[]): Tweet[] {
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

function App() {
  const [filteredTweets, setFilteredTweets] = useState<Tweet[]>([]);
  const [isLoadingTweets, setIsLoadingTweets] = useState<boolean>(false);
  const filteredTweetsContainerRef = useRef<HTMLDivElement>(null);

  function observeTimelineAndLoadTweets(timelineElement: HTMLElement) {
    let observedTweets: Tweet[] = [];
    const timelineTweetsObserver = new MutationObserver(async (mutations: MutationRecord[]) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await new Promise(resolve => requestAnimationFrame(resolve));

      const newTweets = mutations.reduce<Tweet[]>((acc, mutation) => {
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
          return uniqueTweets;
        });

        observedTweets = [];
      }
    });

    timelineTweetsObserver.observe(timelineElement, { childList: true });

    return timelineTweetsObserver;
  }

  // Initialize chrome extension
  useEffect(() => {
    // Initialize timeLineObserver
    let timelineTweetsObserver: any | null = null;
    const timelineElementDetectionIntervalId = setInterval(() => {
      const timelineElement = getTimeLineElementNode();
      if (timelineElement instanceof HTMLElement) {
        clearInterval(timelineElementDetectionIntervalId);

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
        timelineTweetsObserver = observeTimelineAndLoadTweets(timelineElement);
        console.log('Timeline element found and observation started');
      } else {
        console.log('Timeline element not found, retrying...');
      }
    }, 500);

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
      console.log('scroll', filteredTweetsContainerRef.current?.scrollHeight, filteredTweetsContainerRef.current?.scrollTop)
      if (!filteredTweetsContainerRef.current || isLoadingTweets) {
        return;
      }

      const { scrollHeight, scrollTop } = filteredTweetsContainerRef.current;
      if (scrollHeight - scrollTop > 5000) {
        return;
      }

      setIsLoadingTweets(true);

      let scrollIntervalId: any | null = null;
      function loadMoreTweetsSetIntervalFunction() {
        console.log('Load more tweets init', filteredTweetsContainerRef.current?.scrollHeight, filteredTweetsContainerRef.current?.scrollTop)
        if (!filteredTweetsContainerRef.current) {
          setIsLoadingTweets(false);
          return clearInterval(scrollIntervalId);
        }

        if (filteredTweetsContainerRef.current.scrollHeight - filteredTweetsContainerRef.current.scrollTop > 5000) {
          setIsLoadingTweets(false);
          return clearInterval(scrollIntervalId);
        }

        console.log('Load more tweets scroll window')
        window.scrollBy(0, window.innerHeight);
      }
      scrollIntervalId = setInterval(loadMoreTweetsSetIntervalFunction, 350);
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
      background-color: rgba(0, 0, 0, 0.6); // 60% black overlay
      backdrop-filter: blur(200px); // 200px blur
      overflow-y: scroll;
      padding: 20px;
    `}>
      <ul css={css`
        list-style-type: none;
        padding: 0;
        width: 100%;
        max-width: 600px;
        color: black;
      `}>
        {filteredTweets.map((tweet) => (
          <li key={tweet.id} css={css`
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 10px;
          `}>
            <div css={css`
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            `}>
              {tweet.profileImage && (
                <img
                  src={tweet.profileImage}
                  alt="Profile"
                  css={css`
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    margin-right: 10px;
                  `}
                />
              )}
              <div>
                <strong>{tweet.profileName}</strong>
                <span css={css`color: #657786; margin-left: 5px;`}>{tweet.profileTag}</span>
              </div>
            </div>
            <p>{tweet.tweetText}</p>
            {tweet.tweetImages.length > 0 && (
              <div css={css`
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 10px;
              `}>
                {tweet.tweetImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Tweet image ${index + 1}`}
                    css={css`
                      width: 100%;
                      height: auto;
                      border-radius: 8px;
                    `}
                  />
                ))}
              </div>
            )}
            <p css={css`color: #657786; font-size: 0.9em;`}>
              {new Date(tweet.tweetTime || '').toLocaleString()}
            </p>
            {tweet.tweetLink && (
              <a href={tweet.tweetLink} target="_blank" rel="noopener noreferrer">View Tweet</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
