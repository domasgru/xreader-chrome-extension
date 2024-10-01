/// <reference types="chrome"/>
import { useState, useEffect, useRef } from 'react';
import { Global, css, CSSObject } from '@emotion/react';
import emotionReset from 'emotion-reset';
import Tweet from './Tweet';
import { TweetInterface } from './TweetInterface';
import { SummaryInterface } from './SummaryInterface';
import OpenAI from 'openai';
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import Summary from './Summary';
import { TIMELINE_WIDTH } from './constants';

const mockLoadTweets = true;
const mockLoadSummary = true;

interface UserPreferences {
  interests: string;
  notInterests: string;
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

function parseTweetNode(node: Element): TweetInterface | null {
  try {
    const hasReplies = window.getComputedStyle(node.firstChild as HTMLElement).borderBottomWidth === '0px' ? true : false;
    const clonedNode = node.cloneNode(true) as Element;

    const tweetTime = clonedNode.querySelector<HTMLTimeElement>('time')?.dateTime;

    // Not a tweet element, but inside a timeline
    if (!tweetTime) {
      return null;
    }

    const allLinks = getAllHrefs(clonedNode as HTMLElement);
    const tweetTexts = clonedNode.querySelectorAll<HTMLElement>('[data-testid="tweetText"]');

    // Handle quoted tweets
    const quoteElement = document.evaluate(".//*[text()='Quote']", clonedNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)?.singleNodeValue as Element;
    const isQuotedTweet = !!quoteElement && !quoteElement.closest('[data-testid="tweetText"]')
    const quoteTweetElement = isQuotedTweet && quoteElement?.parentElement?.nextElementSibling;
    const quotedTweet = quoteTweetElement ? parseTweetNode(quoteTweetElement) : null;

    // Handle retweets
    const retweetAuthorElement = clonedNode.querySelector<HTMLElement>('[data-testid="socialContext"]');
    const retweetAuthor = retweetAuthorElement ? getAllTextNodes(retweetAuthorElement)?.[0]?.nodeValue || null : null

    // Handle tweet videos
    const tweetVideoPosters = Array.from(clonedNode.querySelectorAll<HTMLVideoElement>('video')).map(video => {
      if (quoteTweetElement && quoteTweetElement.contains(video)) {
        return null;
      }

      return video?.poster;
    }).filter(src => src !== null);

    // Handle images
    const tweetImages = Array.from(clonedNode.querySelectorAll<HTMLImageElement>('[data-testid="tweetPhoto"] img')).map(img => {
      if (quoteTweetElement && quoteTweetElement.contains(img)) {
        return null;
      }

      return img?.src;
      // Sometimes tweet with videos has duplicate image of a poster
    }).filter(src => src !== null).filter(src => !tweetVideoPosters.includes(src));

    // Handle long text tweets
    const showMoreElement = clonedNode.querySelector<HTMLElement>('[data-testid="tweet-text-show-more-link"]');
    let hasShowMore = false;
    if (showMoreElement) {
      if (quoteTweetElement && quoteTweetElement.contains(showMoreElement)) {
        hasShowMore = false;
      } else {
        hasShowMore = true;
      }
    }

    // Handle link card
    const linkCardLinkElement = clonedNode.querySelector<HTMLAnchorElement>('[data-testid="card.wrapper"] a');
    const tweetLinkCard = linkCardLinkElement?.href ? {
      linkCardUrl: linkCardLinkElement.href,
      linkCardImage: linkCardLinkElement.querySelector<HTMLImageElement>('img')?.src,
      linkCardLink: linkCardLinkElement.querySelector<HTMLAnchorElement>('a')?.href,
      linkCardTitle: linkCardLinkElement.textContent || undefined,
    } : undefined;

    // Handle user details
    const profileImage = clonedNode.querySelector<HTMLImageElement>('[data-testid="Tweet-User-Avatar"] img')?.src;
    const profileElement = clonedNode.querySelector<HTMLElement>('[data-testid="User-Name"]');
    const profileTextNodes = profileElement ? getAllTextNodes(profileElement) : null;
    const profileName = profileTextNodes?.[0]?.textContent?.trim();
    const profileTag = profileTextNodes?.[1]?.textContent?.trim();

    const tweetText = tweetTexts[0]?.textContent || undefined;

    const tweetUniqueString = clonedNode.querySelector<HTMLTimeElement>('time')?.dateTime + ((retweetAuthor || profileName)?.split(' ').join('') || '') + tweetText?.slice(0, 5)?.trim();
    const id = stringToId(tweetUniqueString);

    const tweetData: TweetInterface = {
      retweetAuthor,
      hasShowMore,
      tweetText,
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
      id,
    };

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

function stringToId(str: string): string {
  let hash: number = 0;
  for (let i: number = 0; i < str.length; i++) {
    const char: number = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const styles: Record<string, CSSObject> = {
  filteredTweetsContainerStyle: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    overflowY: 'scroll',
    fontFamily: "'TwitterChirp', sans-serif",
  },
  maxWidthContainer: {
    position: 'relative',
    width: '1500px',
    maxWidth: '100%',
    display: 'flex',
    alignItems: 'start',
  },
  summaryContainer: {
    width: `${TIMELINE_WIDTH}px`,
  },
  timelineContainer: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start',
    position: 'relative',
  },
  timeline: {
    width: `${TIMELINE_WIDTH}px`,
    borderTop: '1px solid #2F3336',
    borderLeft: '1px solid #2F3336',
    borderRight: '1px solid #2F3336',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
    width: '100%'
  },
  modalContent: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100vh',
  },
  modalImage: {
    maxWidth: '90%',
    maxHeight: '90vh',
    objectFit: 'contain',
  },
}

function App() {
  const [filteredTweets, setFilteredTweets] = useState<TweetInterface[]>([]);
  const filteredTweetsRef = useRef<TweetInterface[]>([]);
  const [isLoadingTweets, setIsLoadingTweets] = useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({ interests: 'design, products, technology, self improvement, breaking news', notInterests: 'jokes, memes, politics, religion, sports' });
  const filteredTweetsContainerRef = useRef<HTMLDivElement>(null);
  const openai = new OpenAI({ apiKey: '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', dangerouslyAllowBrowser: true });

  const loadMoreTweetsAbortController = useRef<AbortController | null>(null);
  const lastSavedTimelineElementChildNode = useRef<HTMLElement | null>(null);
  async function loadMoreTweets(shouldStopLoadingFunction: () => boolean): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const functionID = Math.random().toString(36).substring(2, 15);
      console.log(functionID, '------INITIALIZED FUNCTION TO LOAD TWEETS-------', filteredTweetsContainerRef.current?.scrollHeight, filteredTweetsContainerRef.current?.scrollTop);

      if (mockLoadTweets) {
        const mockTweets = await import('./exampleTweets.json');
        setFilteredTweets(mockTweets.default as TweetInterface[]);
        return resolve();
      }

      // If there is no timeline element
      const timelineElement = getTimeLineElementNode();
      if (!timelineElement) {
        return;
      }

      // If another loadMoreTweets is running, abort it, and wait for it to completely finish
      if (loadMoreTweetsAbortController.current) {
        loadMoreTweetsAbortController.current.abort();
        console.log(functionID, 'ABORTED PREVIOUS LOAD MORE TWEETS');
        while (loadMoreTweetsAbortController.current) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      loadMoreTweetsAbortController.current = new AbortController();
      setIsLoadingTweets(true);

      try {
        let tweetsToAdd: TweetInterface[] = [];

        while (!shouldStopLoadingFunction() && !loadMoreTweetsAbortController.current.signal.aborted) {
          const isRunningFirstTime = !lastSavedTimelineElementChildNode.current;
          if (lastSavedTimelineElementChildNode.current) {
            lastSavedTimelineElementChildNode.current.scrollIntoView();
            console.log(functionID, '--Scrolling window');
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          if (loadMoreTweetsAbortController.current.signal.aborted) {
            console.log(functionID, 'ABORTED LOAD MORE TWEETS');
            break;
          }

          const renderedTweetsArray = Array.from(timelineElement.childNodes);
          const parseFromIndex = lastSavedTimelineElementChildNode.current
            ? renderedTweetsArray.findIndex(node => node === lastSavedTimelineElementChildNode.current) + 1
            : 0;
          const parseToIndex = renderedTweetsArray.length;
          const arrayToParse = renderedTweetsArray.slice(parseFromIndex, parseToIndex);
          const parsedTweets = arrayToParse.map(node => parseTweetNode(node as Element)).filter(tweet => tweet !== null);
          tweetsToAdd = [...tweetsToAdd, ...parsedTweets];
          lastSavedTimelineElementChildNode.current = timelineElement.lastChild as HTMLElement;
          console.log(functionID, '--Observing tweets');

          if (tweetsToAdd.length > 30 || isRunningFirstTime) {
            const tweetsToAddCopy = [...tweetsToAdd];
            console.log(functionID, '--Adding tweets to state', tweetsToAddCopy);

            setFilteredTweets(prevTweets => {
              const uniqueTweets = getUniqueTweets([...prevTweets, ...tweetsToAddCopy]);
              return uniqueTweets;
            });
            tweetsToAdd = [];
          }
        }
      } catch (error) {
        console.error('Error in loadMoreTweets:', error);
      } finally {
        loadMoreTweetsAbortController.current = null;
        setIsLoadingTweets(false);
        resolve();
      }
    })
  }

  async function generateSummary() {
    if (mockLoadSummary) {
      const mockSummary = await import('./exampleSummary.json');
      setSummary(mockSummary.default);
      setIsLoadingSummary(false);
      return;
    }

    setIsLoadingSummary(true);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await loadMoreTweets(() => {
      console.log('--->', filteredTweetsRef.current)
      const hasReachedTargetTweet = filteredTweetsRef.current.some(tweet => {
        if (new Date(tweet.tweetTime) <= twentyFourHoursAgo && tweet.retweetAuthor === null && !tweet.hasReplies) {
          console.log('--Reached target tweet', tweet);
          return true;
        }
        return false;
      });

      return hasReachedTargetTweet;
    })

    const tweets = [...filteredTweetsRef.current];

    const processedTweets = tweets.map(({ id, tweetText, profileName }) => {
      if (tweetText) {
        return {
          id,
          tweetText,
          profileName,
        }
      }

      return null
    }).filter(tweet => tweet !== null);

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You will be provided a list of tweets. Write a bullet-list type summary of these tweets, respecting user preferences:
          \nInterests: ${userPreferences.interests}
          \nNot interests: ${userPreferences.notInterests}
          `
        },
        { role: "user", content: JSON.stringify(processedTweets) },
      ],
      response_format: zodResponseFormat(
        z.object({
          summaryItems: z.array(z.object({
            summaryItemText: z.string(),
            relatedTweetsIds: z.array(z.string()),
          }))
        }),
        "summary_from_tweets"
      ),
    });

    const writtenSummaryItems = completion.choices[0].message.parsed?.summaryItems?.map(
      (item) => {
        return {
          text: item.summaryItemText,
          relatedTweets: item.relatedTweetsIds.map(id => tweets.find(tweet => tweet.id === id)).filter(tweet => tweet !== undefined),
        }
      }
    );
    const summaryTimeRangeFrom = tweets[0].tweetTime;
    const summaryTimeRangeTo = tweets[tweets.length - 1].tweetTime;
    const media = tweets.reduce((acc: SummaryInterface['media'], tweet) => {
      if (tweet.tweetImages && tweet.tweetImages.length > 0) {
        const existingAuthor = acc.find(item => item.authorName === tweet.profileName);
        if (existingAuthor) {
          existingAuthor.images.push(
            ...tweet.tweetImages.map(image => ({
              imageUrl: image,
              tweetText: tweet.tweetText,
              tweetId: tweet.id,
              tweetLink: tweet.tweetLink,
            }))
          );
        } else {
          acc.push({
            authorName: tweet.profileName,
            authorProfileImage: tweet.profileImage,
            images: [
              ...tweet.tweetImages.map(image => ({
                imageUrl: image,
                tweetText: tweet.tweetText,
                tweetId: tweet.id,
                tweetLink: tweet.tweetLink,
              })),
            ],
          });
        }
      }
      return acc;
    }, []);


    const summary = {
      writtenSummaryItems,
      timeFrom: summaryTimeRangeFrom,
      timeTo: summaryTimeRangeTo,
      media,
    }

    setSummary(summary);
    setIsLoadingSummary(false);
  }

  // Initialize chrome extension
  useEffect(() => {
    const timelineElement = getTimeLineElementNode();

    function preventScrollOnTimeline(e: WheelEvent) {
      const { scrollTop, scrollHeight, clientHeight } = filteredTweetsContainerRef.current as HTMLElement;

      // Check if user scrolling at the top or bottom of the scroll
      if ((scrollTop <= 0 && (e as WheelEvent).deltaY < 0) || (Math.round(scrollTop + clientHeight) >= scrollHeight && (e as WheelEvent).deltaY > 0)) {
        e.preventDefault();
      }
    }

    function initializeExtension() {
      console.log('initializeExtension');
      document.addEventListener('wheel', preventScrollOutsideExtentionUIEventListener, { passive: false } as EventListenerOptions);
      (document.querySelector('#ai-reader-root') as HTMLElement)?.addEventListener('wheel', preventScrollOnTimeline, { passive: false } as EventListenerOptions);

      loadMoreTweets(() => {
        if (!filteredTweetsContainerRef.current) {
          return false;
        }

        return filteredTweetsContainerRef.current.scrollHeight - filteredTweetsContainerRef.current.scrollTop > 5000
      });
    }

    function initializeExtensionRetryFunction() {
      const timelineElement = getTimeLineElementNode();
      if (timelineElement instanceof HTMLElement) {
        clearInterval(timelineElementDetectionIntervalId);

        initializeExtension();

        console.log('Timeline element found and observation started');
      } else {
        console.log('Timeline element not found, retrying...');
      }
    }

    let timelineElementDetectionIntervalId: any | null = null;
    if (timelineElement) {
      initializeExtension();
    } else {
      timelineElementDetectionIntervalId = setInterval(initializeExtensionRetryFunction, 300);
    }

    return () => {
      console.log('UNMOUNTING APP, REMOVING EVENT LISTENERS');
      clearInterval(timelineElementDetectionIntervalId);
      document.removeEventListener('wheel', preventScrollOutsideExtentionUIEventListener, { passive: false } as EventListenerOptions);
      (document.querySelector('#ai-reader-root') as HTMLElement)?.removeEventListener('wheel', preventScrollOnTimeline, { passive: false } as EventListenerOptions);
      if (loadMoreTweetsAbortController.current) {
        loadMoreTweetsAbortController.current.abort();
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

      loadMoreTweets(() => {
        if (!filteredTweetsContainerRef.current) {
          return false;
        }

        return filteredTweetsContainerRef.current.scrollHeight - filteredTweetsContainerRef.current.scrollTop > 5000
      });
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

  useEffect(() => {
    filteredTweetsRef.current = filteredTweets;
  }, [filteredTweets]);

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
      <div ref={filteredTweetsContainerRef} css={styles.filteredTweetsContainerStyle}>
        <div css={styles.maxWidthContainer}>
          <div
            css={{
              ...(isLoadingSummary && {
                pointerEvents: 'none',
              }),
              ...((isLoadingSummary || !summary) && {
                position: 'fixed',
                bottom: '32px',
                right: `calc(50% + ${TIMELINE_WIDTH / 2}px + 40px)`,
                zIndex: 10
              }),
              ...(summary && {
                position: 'sticky',
                top: '0',
                left: '0',
                height: '100vh',
                width: '574px',
                padding: '32px 0 32px 32px'
              })
            }}
            onWheel={(e) => e.stopPropagation()}
          >
            <Summary
              isLoading={isLoadingSummary}
              summaryData={summary}
              onGenerate={generateSummary}
              setShowModal={setShowModal}
            />
          </div>
          <div css={styles.timelineContainer}>
            <div css={styles.timeline}>
              {filteredTweets.map((tweet) => (
                <Tweet
                  key={tweet.id}
                  tweet={tweet}
                  isQuote={false}
                />
              ))}
            </div>
            {showModal && (
              <div css={styles.modalOverlay}>
                <div css={styles.modalContent}>
                  <img src={showModal} css={styles.modalImage} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div >
    </>
  );
}

export default App;