import { CSSObject, keyframes } from '@emotion/react';
import React, { useRef, useEffect } from 'react';
import { SummaryInterface } from './SummaryInterface';

interface SummaryProps {
  isLoading: boolean;
  summaryData: SummaryInterface | null;
  onGenerate: () => void;
  setShowModal: React.Dispatch<React.SetStateAction<string | null>>;
}

const loadingAnimation = keyframes`
  0%, 24% { clip-path: inset(0 100% 0 0); }
  25%, 49% { clip-path: inset(0 66% 0 0); }
  50%, 74% { clip-path: inset(0 33% 0 0); }
  75%, 100% { clip-path: inset(0 0 0 0); }
`;
const summaryStyles: Record<string, CSSObject> = {
  summaryContainerStyleInline: {
    position: 'relative',
    zIndex: 10
  },
  container: {
    backgroundColor: '#1A1C1F',
    color: '#71767A',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '0px',
    fontSize: '16px',
    zIndex: 10,
    overflowY: 'scroll'
  },
  generateButton: {
    backgroundColor: 'transparent',
    color: '#71767A',
    border: 'none',
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    width: '232px',
    maxWidth: '100%',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '14px',
    color: '#929BA0',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 500,
  },
  loadingDots: {
    position: 'relative',
    width: '16px',
    height: '14px',
    marginLeft: '1px',
    overflow: 'hidden',
  },
  loadingDotsContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    color: '#929BA0',
    fontSize: '14px',
    lineHeight: '14px',
    letterSpacing: '2px',
    fontWeight: 500,
    animation: `${loadingAnimation} 1.2s steps(1, end) infinite`,
  },
  loadingSubtext: {
    color: '#71767A',
    fontSize: '14px',
    lineHeight: '1.375',
  },

  // Summary preview
  summaryPreviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '556px',
    maxWidth: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    lineHeight: 'calc(27/20)',
    margin: 0,
    color: '#E7E9EA'
  },
  subtitle: {
    fontSize: '16px',
    lineHeight: 'calc(27/16)',
    color: '#71767A',
    margin: 0,
  },
  regenerateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#71767A',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '12px 20px',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  summaryList: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    color: '#C9CDCF'
  },
  summaryItem: {
    fontSize: '16px',
    lineHeight: 'calc(24/16)',
  },
  idList: {
    display: 'inline',
    color: '#1D9BF0',
    marginLeft: '5px',
  },
  mediaSection: {
    marginTop: '40px',
  },
  mediaDivider: {
    borderTop: '1px solid #71767A',
    marginTop: '8px',
    marginBottom: '8px',
    textAlign: 'center',
    position: 'relative',
  },
  mediaDividerText: {
    backgroundColor: '#1e1e1e',
    padding: '0 10px',
    position: 'relative',
    top: '-10px',
    color: '#a0a0a0',
    fontSize: '14px',
  },
  mediaItem: {
    marginBottom: '32px',
  },
  mediaAuthor: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#a0a0a0',
  },
  mediaAuthorImage: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    marginRight: '8px',
    objectFit: 'cover',
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  },
  mediaImage: {
    width: '100%',
    height: 'auto',
    aspectRatio: '1/1',
    objectFit: 'cover',
  },
};

// Add this helper function at the top of the file, after the imports
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${hours}:${minutes}`;
};

const Summary: React.FC<SummaryProps> = ({ isLoading, summaryData, onGenerate, setShowModal }) => {
  const summaryRef = useRef<HTMLDivElement>(null);

  // Handle scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!summaryRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = summaryRef.current;
      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;

      if (
        (isScrollingUp && scrollTop <= 0) ||
        (isScrollingDown && scrollTop + clientHeight >= scrollHeight)
      ) {
        e.preventDefault();
      }
    };

    const currentRef = summaryRef.current;
    if (currentRef) {
      currentRef.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <div
      ref={summaryRef}
      css={{
        ...summaryStyles.container,
        ...(isLoading && {
          padding: '18px 20px',
        }),
        ...(!isLoading && summaryData && {
          padding: '24px 32px',
          height: '100%',
          overflowY: 'auto',
        })
      }}
    >
      {isLoading && (
        <div css={summaryStyles.loadingContainer}>
          <div css={summaryStyles.loadingText}>
            Generating summary
            <div css={summaryStyles.loadingDots}>
              <span css={summaryStyles.loadingDotsContent}>...</span>
            </div>
          </div>
          <span css={summaryStyles.loadingSubtext}>Please keep this tab open until summary is generated.</span>
        </div>
      )}
      {!isLoading && !summaryData && (
        <button css={summaryStyles.generateButton} onClick={onGenerate}>
          Generate summary
        </button>
      )}
      {!isLoading && summaryData && (
        <div css={summaryStyles.summaryPreviewContainer}>
          <div css={summaryStyles.header}>
            <div>
              <h2 css={summaryStyles.title}>Summary</h2>
              <p css={summaryStyles.subtitle}>
                {formatDate(summaryData.timeFrom)} - {formatDate(summaryData.timeTo)}
              </p>
            </div>
            <button css={summaryStyles.regenerateButton} onClick={onGenerate}>Regenerate</button>
          </div>
          <ul css={summaryStyles.summaryList}>
            {summaryData?.writtenSummaryItems.map((item, index) => (
              <li key={index} css={summaryStyles.summaryItem}>
                {item.text}
                <span css={summaryStyles.idList}>
                  [
                  {item.relatedTweets.map((relatedTweet, i) => (
                    <React.Fragment key={relatedTweet.id}>
                      {i > 0 && ' '}
                      <span
                        css={{
                          cursor: 'pointer',
                          padding: '0 4px',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {i + 1}
                      </span>
                      {i < item.relatedTweets.length - 1 && ','}
                    </React.Fragment>
                  ))}
                  ]
                </span>
              </li>
            ))}
          </ul>
          <div css={summaryStyles.mediaSection}>
            <div css={summaryStyles.mediaDivider}>
              <span css={summaryStyles.mediaDividerText}>MEDIA</span>
            </div>
            {summaryData?.media.map((mediaItem, index) => (
              <div onMouseLeave={() => setShowModal(null)} css={summaryStyles.mediaItem} key={index}>
                <div css={summaryStyles.mediaAuthor}>
                  {mediaItem.authorProfileImage && (
                    <img
                      src={mediaItem.authorProfileImage}
                      alt={`${mediaItem.authorName || 'Author'}'s profile`}
                      css={summaryStyles.mediaAuthorImage}
                    />
                  )}
                  {mediaItem.authorName}
                </div>
                <div css={summaryStyles.mediaGrid}>
                  {mediaItem.images.map((image, imgIndex) => (
                    <img
                      key={imgIndex}
                      src={image.imageUrl}
                      alt={image.tweetText || `Image ${imgIndex + 1}`}
                      onMouseEnter={() => setShowModal(image.imageUrl || null)}
                      css={summaryStyles.mediaImage}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Summary;