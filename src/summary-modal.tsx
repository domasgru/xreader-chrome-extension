import React, { useRef, useState, useEffect } from "react";
import { CSSObject } from "@emotion/react";
import { SummaryData } from "./types";
import CrossIcon from "./assets/cross-large.svg?react";
import { motion } from "framer-motion";
import SummaryToggleItem from "./summary-toggle-item";
import SummaryImageModal from "./summary-image-modal";

interface SummaryModalProps {
  summaryData: SummaryData | null;
  onClose: () => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month} ${day}, ${hours}:${minutes}`;
};

const SummaryModal: React.FC<SummaryModalProps> = ({
  summaryData,
  onClose,
}) => {
  const summaryRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<
    SummaryData["mediaItems"][0]["images"][0] | null
  >(null);

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
      //currentRef.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  return (
    <>
      <div css={summaryStyles.modalOverlay} onClick={onClose} />
      <motion.div
        layoutId="container"
        transition={{ type: "spring", duration: 0.6, bounce: 0 }}
        ref={summaryRef}
        id="summary-preview-container"
        css={summaryStyles.summaryPreviewContainer}
      >
        <div css={summaryStyles.header}>
          <div>
            <h2 css={summaryStyles.title}>Summary</h2>
            <p css={summaryStyles.subtitle}>
              {formatDate(summaryData?.timeFrom || "")} -{" "}
              {formatDate(summaryData?.timeTo || "")}
            </p>
          </div>
          <div css={summaryStyles.buttonGroup}>
            <button css={summaryStyles.closeButton} onClick={onClose}>
              <CrossIcon />
            </button>
          </div>
        </div>
        <ul css={summaryStyles.summaryList}>
          {summaryData?.textItems.map((item, index) => (
            <SummaryToggleItem key={index} item={item} />
          ))}
        </ul>
        <div css={summaryStyles.mediaSection}>
          <div css={summaryStyles.mediaDivider}>
            <span css={summaryStyles.mediaDividerText}>MEDIA</span>
          </div>
          {summaryData?.mediaItems.map((mediaItem, index) => (
            <div css={summaryStyles.mediaItem} key={index}>
              <div css={summaryStyles.mediaAuthor}>
                {mediaItem.authorProfileImage && (
                  <img
                    src={mediaItem.authorProfileImage}
                    alt={`${mediaItem.authorName || "Author"}'s profile`}
                    css={summaryStyles.mediaAuthorImage}
                  />
                )}
                {mediaItem.authorName}
              </div>
              <div css={summaryStyles.mediaGrid}>
                {mediaItem.images.map((image, imgIndex) => (
                  <div
                    key={imgIndex}
                    css={[
                      summaryStyles.mediaImageWrapper,
                      {
                        backgroundImage: `url(${image.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        cursor: "zoom-in",
                      },
                    ]}
                    onClick={() => setSelectedImage(image)}
                    title={`View larger image ${imgIndex + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      {selectedImage && (
        <SummaryImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

const summaryStyles: Record<string, CSSObject> = {
  modalOverlay: {
    position: "fixed",
    zIndex: 999,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(3px)",
  },
  // Summary preview
  summaryPreviewContainer: {
    position: "fixed",
    zIndex: 1000,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    width: "650px",
    maxWidth: "100%",
    padding: "24px 32px",
    height: "95%",
    overflowY: "auto",
    backgroundColor: "#181A1D",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "inset 0 0 3px 1px rgba(255, 255, 255, 0.06)",
    borderRadius: "8px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    marginBottom: "24px",
  },
  title: {
    fontSize: "20px",
    lineHeight: "calc(27/20)",
    margin: 0,
    color: "#E7E9EA",
  },
  subtitle: {
    fontSize: "16px",
    lineHeight: "calc(27/16)",
    color: "#71767A",
    margin: 0,
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#71767A",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    width: "42px",
    height: "42px",
    borderRadius: "100%",
    cursor: "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      color: "#C9CDCF",
    },
  },
  summaryList: {
    listStyleType: "none",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    color: "#C9CDCF",
  },
  summaryItem: {
    fontSize: "16px",
    lineHeight: "calc(24/16)",
  },
  idList: {
    display: "inline",
    color: "#1D9BF0",
    marginLeft: "5px",
  },
  mediaSection: {
    marginTop: "40px",
  },
  mediaDivider: {
    borderTop: "1px solid #71767A",
    marginTop: "8px",
    marginBottom: "8px",
    textAlign: "center",
    position: "relative",
  },
  mediaDividerText: {
    backgroundColor: "#181A1D",
    padding: "0 10px",
    position: "relative",
    top: "-10px",
    color: "#a0a0a0",
    fontSize: "14px",
  },
  mediaItem: {
    marginBottom: "32px",
  },
  mediaAuthor: {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
    fontSize: "14px",
    color: "#a0a0a0",
  },
  mediaAuthorImage: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    marginRight: "8px",
    objectFit: "cover",
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "2px",
  },
  mediaImageWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "1/1",
  },
};

export default SummaryModal;
