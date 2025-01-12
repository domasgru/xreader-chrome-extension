import { CSSObject } from "@emotion/react";
import { memo } from "react";
import Tweet from "./tweet";
import { TweetData } from "./types";

interface TimelineProps {
  tweets: TweetData[];
}

const Timeline = memo(function Timeline({ tweets }: TimelineProps) {
  return (
    <div css={styles.timeline}>
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} tweet={tweet} isQuote={false} />
      ))}
    </div>
  );
});

const styles: Record<string, CSSObject> = {
  timeline: {
    width: "100%",
    minWidth: "0px",
    borderTop: "1px solid #2F3336",
    borderLeft: "1px solid #2F3336",
    borderRight: "1px solid #2F3336",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 1,
  },
};

export default Timeline;
