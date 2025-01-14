import * as React from "react";
import { CSSObject } from "@emotion/react";
import GenerateSummaryButton from "./generate-summary-button";
import SummaryModal from "./summary-modal";
import { TIMELINE_WIDTH } from "./constants";
import IntroPopup from "./intro-popup";
import { motion } from "framer-motion";
import { useTweets } from "./context/tweets-context";
import Timeline from "./timeline";
import { useLocalStorage } from "usehooks-ts";
import { usePreventScrollOnTwitter } from "./hooks/use-prevent-scroll-on-twitter";
import { useLoadTweets } from "./hooks/use-load-tweets";
import { useSummary } from "./hooks/use-summary";

export default function AppContent() {
  const { tweets } = useTweets();
  const {
    summary,
    isLoadingSummary,
    generateSummary,
    isSummaryModalOpen,
    closeSummaryModal,
  } = useSummary();
  const [showIntroPopup, setShowIntroPopup] = useLocalStorage(
    "xReaderShowIntroPopup",
    true
  );

  const appRootContainerRef = React.useRef<HTMLDivElement>(null);
  usePreventScrollOnTwitter(appRootContainerRef);
  useLoadTweets(appRootContainerRef);

  return (
    <div ref={appRootContainerRef} css={styles.filteredTweetsContainerStyle}>
      <div css={styles.maxWidthContainer}>
        <motion.div
          layout
          layoutRoot
          css={{
            ...styles.sideContainer,
            ...(isLoadingSummary && {
              pointerEvents: "none",
            }),
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          {showIntroPopup && (
            <motion.div css={styles.introPopupContainer}>
              <IntroPopup onClose={() => setShowIntroPopup(false)} />
            </motion.div>
          )}
          {!showIntroPopup && (
            <GenerateSummaryButton
              isLoading={isLoadingSummary}
              onGenerate={() => generateSummary(1)}
            />
          )}
        </motion.div>
        <div css={styles.timelineContainer}>
          <Timeline tweets={tweets} />
        </div>
        <div css={styles.sideContainer} />
      </div>

      {isSummaryModalOpen && (
        <SummaryModal summaryData={summary} onClose={closeSummaryModal} />
      )}
    </div>
  );
}

const styles: Record<string, CSSObject> = {
  filteredTweetsContainerStyle: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "start",
    zIndex: 1,
    backgroundColor: "#000000",
    overflowY: "auto",
    overflowX: "hidden",
    fontFamily: "'TwitterChirp', sans-serif",
  },
  maxWidthContainer: {
    position: "relative",
    width: "1400px",
    maxWidth: "100%",
    display: "flex",
    alignItems: "start",
  },
  summaryContainer: {
    width: `${TIMELINE_WIDTH}px`,
  },
  introPopupContainer: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    zIndex: 1000,
    padding: "32px 16px",
  },
  sideContainer: {
    position: "sticky",
    top: "0",
    left: "0",
    height: "100vh",
    flex: "1 1 0px",
    minWidth: "0px",
    padding: "32px 16px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    zIndex: 100,
  },
  timelineContainer: {
    width: `${TIMELINE_WIDTH}px`,
    maxWidth: "100%",
    minWidth: "0px",
    flex: "0 1 auto",
    paddingTop: "20px",
  },
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 1000,
    width: "100%",
  },
  modalContent: {
    position: "sticky",
    top: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100vh",
  },
  modalImage: {
    maxWidth: "90%",
    maxHeight: "90vh",
    objectFit: "contain",
  },
};
