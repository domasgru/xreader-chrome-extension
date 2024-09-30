/// <reference types="chrome"/>
import { useState, useEffect, useRef, useCallback } from 'react';
import { Global, css } from '@emotion/react';
import emotionReset from 'emotion-reset';
import Tweet from './Tweet';
import { TweetInterface } from './TweetInterface';
import OpenAI from 'openai';
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import Summary from './Summary';
import { TIMELINE_WIDTH } from './constants';

interface UserPreferences {
  interests: string;
  notInterests: string;
}

interface EmbeddingCache {
  [key: string]: number[];
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
    //debugger
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

    const id = clonedNode.querySelector<HTMLTimeElement>('time')?.dateTime + ((retweetAuthor || profileName)?.split(' ').join('') || '');

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
      id,
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

function cosineSimilarity(a: number[], b: number[]) {
  const dotProduct = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

const styles = {
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
}

function App() {
  const [filteredTweets, setFilteredTweets] = useState<TweetInterface[]>([]);
  const [isLoadingTweets, setIsLoadingTweets] = useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({ interests: 'design, products, technology, self improvement, breaking news', notInterests: 'jokes, memes, politics, religion, sports' });
  const [embeddingCache, setEmbeddingCache] = useState<EmbeddingCache>({});
  const filteredTweetsContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingTweetsRef = useRef<boolean>(false);
  const useMockData = false;
  const openai = new OpenAI({ apiKey: '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', dangerouslyAllowBrowser: true });

  const getCachedEmbedding = useCallback(async (text: string) => {
    if (embeddingCache[text]) {
      return embeddingCache[text];
    }
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    const embedding = response.data[0].embedding;
    setEmbeddingCache(prev => ({ ...prev, [text]: embedding }));
    return embedding;
  }, [embeddingCache]);

  const filterRelevantTweets = useCallback(async (tweets: TweetInterface[]) => {
    const interestsEmbedding = await getCachedEmbedding(userPreferences.interests);
    const notInterestsEmbedding = await getCachedEmbedding(userPreferences.notInterests);

    const tweetTexts = tweets.map(tweet => tweet.tweetText || '');
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: tweetTexts,
    });

    const tweetEmbeddings = response.data.map(item => item.embedding);

    return tweets.filter((_, index) => {
      const tweetEmbedding = tweetEmbeddings[index];
      const interestsSimilarity = cosineSimilarity(tweetEmbedding, interestsEmbedding);
      const notInterestsSimilarity = cosineSimilarity(tweetEmbedding, notInterestsEmbedding);
      return interestsSimilarity > notInterestsSimilarity;
    });
  }, [userPreferences, getCachedEmbedding]);

  async function loadMoreTweets(untilConditionFunction: () => boolean) {
    if (useMockData) {
      const mockTweets = await import('./exampleTweets.json');
      setFilteredTweets(mockTweets.default as TweetInterface[]);
      return;
    }

    const timelineElement = getTimeLineElementNode();

    if (isLoadingTweetsRef.current || !timelineElement) {
      return;
    }

    isLoadingTweetsRef.current = true;
    setIsLoadingTweets(true);

    let lastSavedTimelineElementChildNode: HTMLElement | null = null;
    let tweetsToAdd: TweetInterface[] = []; console.log('------INITIALIZED FUNCTION TO LOAD TWEETS-------', filteredTweetsContainerRef.current?.scrollHeight, filteredTweetsContainerRef.current?.scrollTop);

    while (isLoadingTweetsRef.current) {
      if (!filteredTweetsContainerRef.current) {
        isLoadingTweetsRef.current = false;
        setIsLoadingTweets(false);
        break;
      }

      if (filteredTweetsContainerRef.current.scrollHeight - filteredTweetsContainerRef.current.scrollTop > 5000) {
        isLoadingTweetsRef.current = false;
        setIsLoadingTweets(false);
        break;
      }

      if (lastSavedTimelineElementChildNode) {
        lastSavedTimelineElementChildNode.scrollIntoView(); console.log('--Scrolling window');
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const renderedTweetsArray = Array.from(timelineElement.childNodes);
      const parseFromIndex = lastSavedTimelineElementChildNode ? renderedTweetsArray.findIndex(node => node === (lastSavedTimelineElementChildNode)) + 1 : 0;
      const parseToIndex = renderedTweetsArray.length;
      const arrayToParse = renderedTweetsArray.slice(parseFromIndex, parseToIndex);
      const parsedTweets = arrayToParse.map(node => parseTweetNode(node as Element)).filter(tweet => tweet !== null);
      tweetsToAdd = [...tweetsToAdd, ...parsedTweets];
      lastSavedTimelineElementChildNode = timelineElement.lastChild as HTMLElement;

      if (tweetsToAdd.length > 30) {
        const tweetsToAddCopy = [...tweetsToAdd]; console.log('--Tweets to add', tweetsToAddCopy);

        // Check if we've reached a tweet that's 24 hours or older, not a retweet, and has no replies
        // const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // const reachedTargetTweet = tweetsToAddCopy.some(tweet => {
        //   if (new Date(tweet.tweetTime) <= twentyFourHoursAgo &&
        //     tweet.retweetAuthor === null &&
        //     !tweet.hasReplies) {
        //     console.log('--Reached target tweet', tweet);
        //     return true;
        //   }
        //   return false;
        // });

        setFilteredTweets(prevTweets => {
          const uniqueTweets = getUniqueTweets([...prevTweets, ...tweetsToAddCopy]);
          return uniqueTweets;
        });

        tweetsToAdd = [];

        // if (reachedTargetTweet) {
        //   isLoadingTweetsRef.current = false;
        //   setIsLoadingTweets(false);
        //   console.log('--Reached target tweet', reachedTargetTweet);
        //   break;
        // }
      }
    }

    isLoadingTweetsRef.current = false;
    setIsLoadingTweets(false);
  }

  async function generateSummary(tweets: TweetInterface[]) {
    if (useMockData) {
      const mockSummary = await import('./exampleSummary.json');
      setSummary(mockSummary.default);
      setIsLoadingSummary(false);
      return;
    }

    setIsLoadingSummary(true);

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

    const Summary = z.object({
      summaryItems: z.array(z.object({
        text: z.string(),
        ids: z.array(z.string()),
      }))
    })

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You will be provided an array of tweets. Write bullet list type summary of the tweets in given structure. Respect user interests and not interests:
          \nInterests: ${userPreferences.interests}
          \nNot interests: ${userPreferences.notInterests}
          `
        },
        { role: "user", content: JSON.stringify(processedTweets) },
      ],
      response_format: zodResponseFormat(Summary, "summary_from_tweets"),
    });

    const writtenSummaryItems = completion.choices[0].message.parsed?.summaryItems;
    const summaryTimeRangeFrom = tweets[0].tweetTime;
    const summaryTimeRangeTo = tweets[tweets.length - 1].tweetTime;
    const media = tweets.reduce((acc: { author: string; images: string[] }[], tweet) => {
      if (tweet.tweetImages && tweet.tweetImages.length > 0) {
        const existingAuthor = acc.find(item => item.author === tweet.profileName);
        if (existingAuthor) {
          existingAuthor.images.push(...tweet.tweetImages);
        } else {
          acc.push({ author: tweet.profileName || 'Unknown', images: [...tweet.tweetImages] });
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

    debugger

    setSummary(summary);
    setIsLoadingSummary(false);
  }

  // Initialize chrome extension
  useEffect(() => {
    const timelineElement = getTimeLineElementNode();

    function initializeExtension() {
      function preventScrollOnTimeline(e: WheelEvent) {
        const { scrollTop, scrollHeight, clientHeight } = filteredTweetsContainerRef.current as HTMLElement;

        // Check if user scrolling at the top or bottom of the scroll
        if ((scrollTop <= 0 && (e as WheelEvent).deltaY < 0) || (Math.round(scrollTop + clientHeight) >= scrollHeight && (e as WheelEvent).deltaY > 0)) {
          e.preventDefault();
        }
      }
      document.addEventListener('wheel', preventScrollOutsideExtentionUIEventListener, { passive: false });
      (document.querySelector('#ai-reader-root') as HTMLElement)?.addEventListener('wheel', preventScrollOnTimeline, { passive: false });

      loadMoreTweets();
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
      clearInterval(timelineElementDetectionIntervalId);
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

      loadMoreTweets();
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

  const handleIdHover = useCallback((id: string) => {
    const tweetElement = document.getElementById(`tweet-${id}`);
    if (tweetElement) {
      tweetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

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
              onGenerate={() => generateSummary(filteredTweets)}
              onIdHover={handleIdHover}
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
          </div>
        </div>
      </div >
    </>
  );
}

export default App;
