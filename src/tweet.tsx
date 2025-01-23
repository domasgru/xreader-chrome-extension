import React from "react";
import { CSSObject } from "@emotion/react";
import { TweetData } from "./types";

function formatTweetDate(time: string): string {
  const tweetDate = new Date(time);
  const now = new Date();
  const diffInMs = now.getTime() - tweetDate.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);
  const diffInHours = diffInMinutes / 60;

  if (diffInMinutes < 1) {
    return "1m";
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}m`;
  } else if (diffInHours <= 24) {
    return `${Math.floor(diffInHours)}h`;
  } else {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
    };
    return tweetDate.toLocaleDateString("en-US", options);
  }
}

function getFullTweetTime(time: string): string {
  const tweetDate = new Date(time);
  return tweetDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setImageSizeToLarge(url: string): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set("name", "large");
  return urlObj.toString();
}

const Tweet: React.FC<{ tweet: TweetData; isQuote: boolean }> = ({
  tweet,
  isQuote,
}) => {
  const handleClick = () => {
    window.open(tweet.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      id={`tweet-${tweet.id}`}
      css={{
        ...styles.tweetContainer,
        ...(isQuote && { padding: "16px", border: "none" }),
        ...(tweet.hasReplies && { borderBottom: "none" }),
      }}
      onClick={handleClick}
    >
      <div css={styles.profileContainer}>
        {!isQuote && (
          <img
            src={tweet.authorProfileImage}
            alt={tweet.authorName}
            css={styles.profileImage}
          />
        )}
        <div css={styles.contentContainer}>
          <div css={styles.headerContainer}>
            {isQuote && (
              <img
                src={tweet.authorProfileImage}
                alt={tweet.authorName}
                css={styles.quoteProfileImage}
              />
            )}
            <div css={styles.profileName}>
              {tweet.authorName}
              {tweet.retweetAuthor && (
                <span css={styles.retweetAuthor}>
                  &nbsp;&nbsp;·&nbsp;&nbsp;{tweet.retweetAuthor} reposted
                </span>
              )}
            </div>
            <span
              css={styles.tweetTime}
              title={getFullTweetTime(tweet.createdAt)}
            >
              {formatTweetDate(tweet.createdAt)}
            </span>
          </div>
          <div
            css={{ ...styles.tweetContent, ...(isQuote && { padding: "0px" }) }}
          >
            <p css={styles.tweetText}>{tweet.textContent}</p>

            {tweet.hasShowMore && (
              <button css={styles.showMoreButton}>Show more</button>
            )}

            {tweet.linkCard && (
              <a
                href={tweet.linkCard?.linkCardLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                css={styles.linkCard}
              >
                {tweet.linkCard.linkCardImage && (
                  <img
                    src={tweet.linkCard.linkCardImage}
                    alt={tweet.linkCard.linkCardTitle || "Link Card"}
                    css={styles.linkCardImage}
                  />
                )}
                <div css={styles.linkCardTitle}>
                  {tweet.linkCard.linkCardTitle}
                </div>
              </a>
            )}

            {tweet.videos?.length > 0 && (
              <div
                css={{
                  ...styles.videoPostersContainer,
                  gridTemplateColumns:
                    tweet.videos.length === 1
                      ? "1fr"
                      : `repeat(${tweet.videos.length}, 1fr)`,
                }}
              >
                {tweet.videos.map(({ poster }, index) => (
                  <div
                    key={index}
                    css={{
                      ...styles.videoPoster,
                      backgroundImage: `url(${poster})`,
                    }}
                  >
                    <div css={styles.playButton}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M8 5v14l11-7L8 5z" fill="#000" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tweet.images.length > 0 && (
              <div
                css={{
                  ...styles.imagesContainer,
                  gridTemplateColumns:
                    tweet.images.length === 1
                      ? "1fr"
                      : `repeat(${tweet.images.length}, 1fr)`,
                }}
              >
                {tweet.images.map((img, index) => (
                  <img
                    key={index}
                    src={setImageSizeToLarge(img)}
                    alt={`Tweet image ${index + 1}`}
                    css={styles.tweetImage}
                  />
                ))}
              </div>
            )}

            {tweet.tweetQuote && (
              <div css={styles.quotedTweet}>
                <Tweet tweet={tweet.tweetQuote} isQuote={true} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, CSSObject> = {
  tweetContainer: {
    color: "#fff",
    padding: "20px 24px",
    borderRadius: 0,
    width: "100%",
    borderBottom: "1px solid #2F3336",
    cursor: "pointer",
    gap: "8px",
    fontSize: "16px",
    display: "flex",
    flexDirection: "column",
  },

  retweetAuthor: {
    color: "#71767A",
    marginBottom: "8px",
  },

  profileContainer: {
    width: "100%",
    gap: "10px",
    display: "flex",
  },

  profileImage: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    opacity: 0.7,
  },

  quoteProfileImage: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    marginRight: "8px",
    opacity: 0.7,
  },

  contentContainer: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0, // Add this line
    overflowWrap: "break-word", // Add this line
  },

  headerContainer: {
    display: "flex",
    paddingRight: "4px",
    lineHeight: 1.125,
  },

  profileName: {
    marginRight: "auto",
    color: "#71767A",
  },

  tweetTime: {
    color: "#71767A",
  },

  tweetContent: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    marginTop: "4px",
    paddingRight: "40px",
  },

  tweetText: {
    whiteSpace: "pre-wrap",
    color: "#e4e6e7",
    lineHeight: 1.5,
  },

  showMoreButton: {
    color: "#1D9BF0",
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
    cursor: "pointer",
    outline: "inherit",
    marginTop: "4px",
    textAlign: "left",
  },

  linkCard: {
    display: "block",
    position: "relative",
    marginTop: "16px",
    border: "1px solid #2F3336",
    borderRadius: "8px",
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
  },

  linkCardImage: {
    width: "100%",
    height: "auto",
    display: "block",
  },

  linkCardTitle: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    padding: "8px",
    background: "rgba(0, 0, 0, 0.6)",
    color: "#fff",
    fontSize: "14px",
    textAlign: "left",
  },

  videoPostersContainer: {
    display: "grid",
    gap: "12px",
    marginTop: "16px",
  },

  videoPoster: {
    position: "relative",
    width: "100%",
    maxHeight: "500px",
    aspectRatio: "16/9",
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    "&:after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.5)",
    },
  },

  playButton: {
    position: "relative",
    zIndex: 1,
    width: "60px",
    height: "60px",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  imagesContainer: {
    display: "grid",
    gap: "12px",
    marginTop: "16px",
  },

  tweetImage: {
    borderRadius: "0px",
    width: "auto",
    maxWidth: "100%",
    maxHeight: "504px",
    height: "auto",

    objectFit: "contain",
    position: "relative",
    marginBottom: "12px",
  },

  quotedTweet: {
    marginTop: "16px",
    border: "1px solid #2F3336",
    borderRadius: "12px",
  },
};

export default Tweet;
