import React, { useState } from "react";
import { SummaryTextItemData } from "./types";
import { CSSObject } from "@emotion/react";
import ChevronDownIcon from "./assets/chevron-down.svg?react";
import Tweet from "./tweet";

interface SummaryToggleItemProps {
  item: SummaryTextItemData;
}

const SummaryToggleItem: React.FC<SummaryToggleItemProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <li css={styles.summaryItem}>
      <div
        css={styles.summaryItemHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div css={styles.chevronIconContainer}>
          <ChevronDownIcon
            css={[styles.chevronIcon, isExpanded && styles.chevronIconExpanded]}
          />
        </div>
        <span css={styles.summaryItemText}>{item.text}</span>
      </div>
      {isExpanded && (
        <div css={styles.summaryItemTextContainer}>
          <div css={styles.relatedTweets}>
            {item.relatedTweets.map((tweet) => (
              <div css={styles.quotedTweet}>
                <Tweet key={tweet.id} tweet={tweet} isQuote={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

const styles: Record<string, CSSObject> = {
  summaryItem: {
    fontSize: "16px",
    lineHeight: "1.6",
  },
  summaryItemHeader: {
    display: "flex",
    gap: "10px",
  },
  summaryItemText: {
    cursor: "default",
    userSelect: "none",
  },
  summaryItemTextContainer: {
    marginTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingLeft: "28px",
  },
  chevronIconContainer: {
    paddingTop: "2.5px",
    display: "flex",
  },
  chevronIcon: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
    transform: "rotate(-90deg)",
  },
  chevronIconExpanded: {
    transform: "rotate(0deg)",
  },
  relatedTweets: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  quotedTweet: {
    border: "1px solid #2F3336",
    borderRadius: "12px",
  },
};

export default SummaryToggleItem;
