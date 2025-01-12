import { useEffect } from "react";

function preventScrollOutsideExtentionUIEventListener(e: WheelEvent) {
  e.stopPropagation();
  if (!(e.target as HTMLElement)?.closest("#ai-reader-root")) {
    e.preventDefault();
  }
}

export function usePreventScrollOnTwitter(
  extensionRootRef: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    function preventScrollOnTimeline(e: WheelEvent) {
      const summaryPreviewContainer = extensionRootRef.current?.querySelector(
        "#summary-preview-container"
      );
      const scrollableElement =
        summaryPreviewContainer || extensionRootRef.current;
      const { scrollTop, scrollHeight, clientHeight } =
        scrollableElement as HTMLElement;

      // Check if user scrolling at the top or bottom of the scroll
      if (
        (scrollTop <= 0 && e.deltaY < 0) ||
        (Math.round(scrollTop + clientHeight) >= scrollHeight && e.deltaY > 0)
      ) {
        e.preventDefault();
      }
    }

    document.addEventListener(
      "wheel",
      preventScrollOutsideExtentionUIEventListener,
      { passive: false }
    );

    document.addEventListener("wheel", preventScrollOnTimeline, {
      passive: false,
    });

    return () => {
      document.removeEventListener(
        "wheel",
        preventScrollOutsideExtentionUIEventListener
      );
      document.removeEventListener("wheel", preventScrollOnTimeline);
    };
  }, []);
}
