/// <reference types="chrome"/>
import { useState, useEffect } from 'react';
import { css } from '@emotion/react';

interface Tweet {
  tweetText?: string;
  tweetLink: string | null;
  tweetImages: string[];
  tweetVideos: string[];
  tweetTime?: string;
  profileImage?: string;
  id: string;
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

function App() {
  const [tweets, setTweets] = useState<Tweet[]>([]);

  useEffect(() => {
    console.log('UseEffect is triggered');
    const observer = new MutationObserver(async (mutations: MutationRecord[]) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(mutations);

      const newTweets = mutations.reduce<Tweet[]>((acc, mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node: Node) => {
            if (node instanceof Element) {
              try {
                const allLinks = getAllHrefs(node);
                const tweetData = {
                  // TODO: handle retweets which have multiple texts
                  tweetText: node.querySelector<HTMLElement>('[data-testid="tweetText"]')?.innerText,
                  tweetLink: (allLinks as string[])?.find(link => link.includes('/status/')) ?? null,
                  tweetImages: Array.from(node.querySelectorAll('img'))?.map(img => img?.src).filter(src => !src?.includes('/profile_images/') && !src?.includes('.svg')),
                  tweetVideos: Array.from(node.querySelectorAll('video'))?.map(video => video?.src),
                  tweetTime: node.querySelector('time')?.dateTime,
                  profileImage: Array.from(node.querySelectorAll('img'))?.map(img => img?.src).find(src => src?.includes('/profile_images/')),
                  id: node.querySelector<HTMLTimeElement>('time')?.dateTime + (node.textContent?.substring(0, 10) ?? '')
                };

                if (tweetData.tweetTime) {
                  console.log(tweetData);
                  acc.push(tweetData);
                }
              } catch (error) {
                console.log('Error processing node', error);
              }
            }
          });
        }
        return acc;
      }, []);

      console.log('newTweets', newTweets)
      setTweets(prevTweets => {
        console.log('prevTweets', prevTweets)
        const uniqueTweets = newTweets.filter(newTweet =>
          !prevTweets.some(prevTweet => prevTweet.id === newTweet.id)
        );
        return [...prevTweets, ...uniqueTweets];
      });
      console.log(tweets)
    });

    const config = {
      childList: true,
    };

    const findAndObserveTimeline = () => {
      const timelineElement = document.querySelector<HTMLElement>('[aria-label="Timeline: Your Home Timeline"]');
      if (timelineElement && timelineElement.firstChild instanceof Node) {
        observer.observe(timelineElement.firstChild, config);
        return true; // Successfully found and started observing
      }
      return false; // Element not found yet
    };

    const intervalId = setInterval(() => {
      if (findAndObserveTimeline()) {
        clearInterval(intervalId); // Stop polling once we've found the element
        console.log('Timeline element found and observation started');
      } else {
        console.log('Timeline element not found, retrying...');
      }
    }, 1000); // Check every second

    const updateTweets = (tweetData: Tweet) => {
      setTweets(prevTweets => [...prevTweets, tweetData]);
    };

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, []); // Remove 'tweets' from the dependency array

  const scrollPage = () => {
    window.scrollBy(0, window.innerHeight);
  };

  return (
    <div css={css`
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
      background-color: rgba(255, 255, 255, 0.9);
      overflow-y: auto;
      padding: 20px;
    `}>
      <button onClick={scrollPage}>Scroll page</button>
      <h2>Captured Tweets</h2>
      <ul css={css`
        list-style-type: none;
        padding: 0;
        width: 100%;
        max-width: 600px;
        color: black;
      `}>
        {tweets.map((tweet) => (
          <li key={tweet.id} css={css`
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 10px;
          `}>
            <p>{tweet.tweetText}</p>
            {tweet.tweetLink && (
              <a href={tweet.tweetLink} target="_blank" rel="noopener noreferrer">View Tweet</a>
            )}
            <p>Posted at: {tweet.tweetTime}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
