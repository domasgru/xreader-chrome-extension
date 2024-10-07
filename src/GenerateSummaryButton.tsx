import React, { useState } from 'react';
import { useFloating, useInteractions, useClick, useRole, useDismiss, offset, flip, shift } from '@floating-ui/react';
import { CSSObject, keyframes } from '@emotion/react';
import SlidersIcon from './assets/sliders.svg?react';
import { UserPreferences } from './UserPreferencesInterface';
import { motion, AnimatePresence, Transition } from 'framer-motion';

interface SummaryProps {
  userPreferences: UserPreferences;
  setUserPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  isLoading: boolean;
  onGenerate: () => void;
}

const buttonTransition: Transition = {
  type: 'spring',
  duration: 0.2,
  bounce: 0,
};

const GenerateSummaryButton: React.FC<SummaryProps> = ({ userPreferences, setUserPreferences, isLoading, onGenerate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top-start',
    middleware: [offset(8), flip(), shift()],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <div css={summaryStyles.mainContainer}>
      <AnimatePresence initial={false} mode='popLayout'>
        {isLoading && (
          <motion.div
            layoutId='container'
            key="loading"
            css={{ ...summaryStyles.container, ...summaryStyles.loadingContainer }}
            transition={buttonTransition}
            exit={{
              opacity: 0,
              width: 0,
              height: 0,
            }}
          >
            <motion.div
              layoutId='titleContainer'
              transition={buttonTransition}
              css={summaryStyles.loadingText}
            >
              <motion.span>
                Writing summary
              </motion.span>
              <motion.div css={summaryStyles.loadingDots}>
                <motion.span css={summaryStyles.loadingDotsContent}>...</motion.span>
              </motion.div>
            </motion.div>
            <motion.span
              layoutId='subtext'
              initial={{ opacity: 0, top: -25 }}
              animate={{ opacity: 1, top: 0 }}
              exit={{ opacity: 0, top: 25 }}
              transition={buttonTransition}
              css={summaryStyles.loadingSubtext}
            >
              Please keep this tab open until summary is generated.
            </motion.span>
          </motion.div>
        )}

        {!isLoading && (
          <motion.div
            layoutId='container'
            key="button"
            css={{ ...summaryStyles.generateButton, ...summaryStyles.container }}
            transition={buttonTransition}
          >
            <motion.button
              layoutId='button'
              transition={buttonTransition}
              ref={refs.setReference}
              {...getReferenceProps()}
              css={summaryStyles.generateButtonIconContainer}
            >
              <SlidersIcon css={summaryStyles.generateButtonIcon} />
            </motion.button>
            <motion.button
              initial={{ boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' }}
              animate={{ boxShadow: 'inset 0 0 3px 1px rgba(255, 255, 255, 0.06)' }}
              exit={{ boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' }}
              transition={buttonTransition}
              layoutId='titleContainer'
              onClick={onGenerate}
              css={summaryStyles.generateButtonText}
            >
              <span>
                Get summary
              </span>
            </motion.button>
            <AnimatePresence>
              {isOpen && (
                <div style={floatingStyles} ref={refs.setFloating} {...getFloatingProps()}>
                  <motion.div
                    css={summaryStyles.popup}
                    style={{ originX: 0, originY: 1 }}
                    initial={{ opacity: 0.5, scale: 0.3, x: -5, y: 0 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0.5, scale: 0.3, x: -5, y: 0 }}
                    transition={{ duration: 0.15, type: 'spring', bounce: 0 }}
                  >
                    <div css={summaryStyles.marginBottom}>
                      <p css={summaryStyles.label}>Interested:</p>
                      <textarea
                        value={userPreferences.interests}
                        css={summaryStyles.textarea}
                        rows={4}
                        onChange={(e) => setUserPreferences(prev => ({ ...prev, interests: e.target.value }))}
                      />
                    </div>
                    <div>
                      <p css={summaryStyles.label}>Not Interested:</p>
                      <textarea
                        value={userPreferences.notInterests}
                        css={summaryStyles.textarea}
                        rows={4}
                        onChange={(e) => setUserPreferences(prev => ({ ...prev, notInterests: e.target.value }))}
                      />
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const loadingAnimation = keyframes`
  0%, 24% { clip-path: inset(0 100% 0 0); }
  25%, 49% { clip-path: inset(0 66% 0 0); }
  50%, 74% { clip-path: inset(0 33% 0 0); }
  75%, 100% { clip-path: inset(0 0 0 0); }
`;

const summaryStyles: Record<string, CSSObject> = {
  mainContainer: {
    position: 'relative',
    flexShrink: 0,
    zIndex: 10
  },
  container: {
    backgroundColor: '#13161A',
    color: '#71767A',
    borderRadius: '4px',
    border: '0.5px solid #2E2E2E',
    padding: '0px',
    fontSize: '14px',
    zIndex: 10,
    overflow: 'hidden',
    flexShrink: 0
  },
  generateButton: {
    lineHeight: 'calc(18/14)',
    border: 'none',
    backgroundColor: 'transparent',
    fontWeight: 500,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40px',
    padding: 0,
    color: '#71767A',
  },
  generateButtonIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '43px',
    borderRight: '0.5px solid #2E2E2E',
    boxShadow: 'inset 0 0 3px 1px rgba(255, 255, 255, 0.06)',
    transition: 'background-color 0.15s ease',
    color: '#71767A',
    '&:hover': {
      backgroundColor: '#181B20',
      color: '#C9CDCF',
    },
  },
  generateButtonIcon: {
    width: '18px',
    height: '18px',
  },
  generateButtonText: {
    padding: '11px 32px 11px 28px',
    height: '100%',
    boxShadow: 'inset 0 0 3px 1px rgba(255, 255, 255, 0.06)',
    color: '#71767A',
    fontWeight: 500,
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: '#181B20',
      color: '#C9CDCF',
    },
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    width: '272px',
    maxWidth: '100%',
    textAlign: 'center',
    padding: '20px',
    boxShadow: 'inset 0 0 3px 1px rgba(255, 255, 255, 0.06)',
  },
  loadingText: {
    fontSize: '14px',
    color: '#929BA0',
    display: 'flex',
    alignItems: 'center',
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
    animation: `${loadingAnimation} 1s steps(1, end) infinite`,
  },
  loadingSubtext: {
    color: '#71767A',
    fontSize: '14px',
    lineHeight: '1.375',
    maxWidth: '100%'
  },
  popup: {
    backgroundColor: '#121314',
    border: '1px solid #2E2E2E',
    borderRadius: '4px',
    padding: '16px',
    color: '#C9CDCF',
    fontSize: '14px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  },
  label: {
    display: 'block',
    color: '#71767A',
    lineHeight: 'calc(13/11)',
    fontSize: '11px',
    marginBottom: '8px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#202427',
    color: '#E7E9EA',
    padding: '8px',
    border: '0.5px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '5px',
    lineHeight: 'calc(18/14)',
    resize: 'none',
    fontFamily: 'inherit',
    fontSize: '14px',
    display: 'block',
  },
  marginBottom: {
    marginBottom: '16px',
  }
};

export default GenerateSummaryButton;