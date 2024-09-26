import React from 'react';
import { TweetInterface } from './TweetInterface';

const isDevelopment = import.meta.env.MODE === 'development';

function formatTweetDate(time: string): string {
  const tweetDate: Date = new Date(time);
  const now: Date = new Date();
  const diffInMs: number = now.getTime() - tweetDate.getTime();
  const diffInMinutes: number = diffInMs / (1000 * 60);
  const diffInHours: number = diffInMinutes / 60;

  if (diffInMinutes < 1) {
    return '1m';
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}m`;
  } else if (diffInHours <= 24) {
    return `${Math.floor(diffInHours)}h`;
  } else {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return tweetDate.toLocaleDateString('en-US', options);
  }
}

function setImageSizeToLarge(url: string): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set('name', 'large');
  return urlObj.toString();
}

const styles = {
  tweetContainer: {
    color: '#fff',
    padding: '20px 24px',
    borderRadius: 0,
    width: '100%',
    borderTop: '1px solid #2F3336',
    borderBottom: '1px solid #2F3336',
    cursor: 'pointer',
    gap: '12px',
    fontSize: '16px',
    display: 'flex',
    flexDirection: 'column',
  } as const,

  retweetAuthor: {
    color: '#71767A',
    marginBottom: '8px',
  } as const,

  profileContainer: {
    width: '100%',
    gap: '16px',
    display: 'flex',
  } as const,

  profileImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    opacity: 0.7,
  } as const,

  quoteProfileImage: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    marginRight: '8px',
  } as const,

  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0, // Add this line
    overflowWrap: 'break-word', // Add this line
  } as const,

  headerContainer: {
    display: 'flex',
    paddingRight: '4px',
    lineHeight: 1.125,
  } as const,

  profileName: {
    marginRight: 'auto',
    color: '#71767A',
  } as const,

  tweetTime: {
    color: '#71767A',
  } as const,

  tweetContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    marginTop: '4px',
    paddingRight: '48px',
  } as const,

  tweetText: {
    whiteSpace: 'pre-wrap',
    color: '#E7E9EA',
    lineHeight: 1.5,
  } as const,

  showMoreButton: {
    color: '#1D9BF0',
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    outline: 'inherit',
    marginTop: '4px',
    textAlign: 'left',
  } as const,

  linkCard: {
    display: 'block',
    position: 'relative',
    marginTop: '16px',
    border: '1px solid #2F3336',
    borderRadius: '8px',
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
  } as const,

  linkCardImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  } as const,

  linkCardTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    padding: '8px',
    background: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    fontSize: '14px',
    textAlign: 'left',
  } as const,

  videoPostersContainer: {
    display: 'grid',
    gap: '12px',
    marginTop: '16px',
  } as const,

  videoPoster: {
    position: 'relative',
    width: '100%',
    maxHeight: '500px',
    aspectRatio: '16/9',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '&:after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
    },
  } as const,

  playButton: {
    position: 'relative',
    zIndex: 1,
    width: '60px',
    height: '60px',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,

  imagesContainer: {
    display: 'grid',
    gap: '12px',
    marginTop: '16px',
  } as const,

  tweetImage: {
    borderRadius: '0px',
    width: 'auto',
    maxWidth: '100%',
    maxHeight: '504px',
    height: 'auto',
    cursor: 'default',
    objectFit: 'contain',
    position: 'relative',
    marginBottom: '12px',
  } as const,

  quotedTweet: {
    marginTop: '16px',
    border: '1px solid #2F3336',
    borderRadius: '12px',
  } as const,
};

const Tweet: React.FC<{ tweet: TweetInterface; isQuote: boolean }> = ({ tweet, isQuote }) => {
  const handleClick = () => {
    window.open(tweet.tweetLink, '_blank', 'noopener,noreferrer');
  };

  const debugData = isDevelopment ? JSON.stringify(tweet.debugData) : undefined;

  return (
    <div
      id={tweet.id}
      css={{
        ...styles.tweetContainer,
        ...(isQuote && { padding: '16px', border: 'none' })
      }}
      onClick={handleClick}
      data-debug={debugData}
    >
      {tweet.retweetAuthor && (
        <div css={styles.retweetAuthor}>
          {tweet.retweetAuthor} reposted
        </div>
      )}
      <div css={styles.profileContainer}>
        {!isQuote && (
          <img
            src={tweet.profileImage}
            alt={tweet.profileName}
            css={styles.profileImage}
          />
        )}
        <div css={styles.contentContainer}>
          <div css={styles.headerContainer}>
            {isQuote && (
              <img
                src={tweet.profileImage}
                alt={tweet.profileName}
                css={styles.quoteProfileImage}
              />
            )}
            <div css={styles.profileName}>
              {tweet.profileName}
            </div>
            <span css={styles.tweetTime}>
              {formatTweetDate(tweet.tweetTime)}
            </span>
          </div>
          <div css={{ ...styles.tweetContent, ...(isQuote && { padding: '0px' }) }}>
            <p css={styles.tweetText}>
              {tweet.tweetText}
            </p>

            {tweet.hasShowMore && (
              <button
                css={styles.showMoreButton}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Show more clicked");
                }}
              >
                Show more
              </button>
            )}

            {tweet.tweetLinkCard && (
              <a
                href={tweet.tweetLinkCard.linkCardLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                css={styles.linkCard}
              >
                {tweet.tweetLinkCard.linkCardImage && (
                  <img
                    src={tweet.tweetLinkCard.linkCardImage}
                    alt={tweet.tweetLinkCard.linkCardTitle || 'Link Card'}
                    css={styles.linkCardImage}
                  />
                )}
                <div css={styles.linkCardTitle}>
                  {tweet.tweetLinkCard.linkCardTitle}
                </div>
              </a>
            )}

            {tweet.tweetVideoPosters.length > 0 && (
              <div
                css={{
                  ...styles.videoPostersContainer,
                  gridTemplateColumns: tweet.tweetVideoPosters.length === 1 ? '1fr' : `repeat(${tweet.tweetVideoPosters.length}, 1fr)`,
                }}
              >
                {tweet.tweetVideoPosters.map((poster, index) => (
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
                        <path
                          d="M8 5v14l11-7L8 5z"
                          fill="#000"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tweet.tweetImages.length > 0 && (
              <div
                css={{
                  ...styles.imagesContainer,
                  gridTemplateColumns: tweet.tweetImages.length === 1 ? '1fr' : `repeat(${tweet.tweetImages.length}, 1fr)`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {tweet.tweetImages.map((img, index) => (
                  <img key={index} src={setImageSizeToLarge(img)} alt={`Tweet image ${index + 1}`} css={styles.tweetImage} />
                ))}
              </div>
            )}

            {tweet.quotedTweet && (
              <div css={styles.quotedTweet}>
                <Tweet tweet={tweet.quotedTweet} isQuote={true} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tweet;