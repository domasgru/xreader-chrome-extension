import React from 'react';
import { CSSObject } from '@emotion/react';
import { SummaryInterface } from './SummaryInterface';

interface SummaryImageModalProps {
  image: SummaryInterface['media'][0]['images'][0];
  onClose: () => void;
}

const SummaryImageModal: React.FC<SummaryImageModalProps> = ({ image, onClose }) => {
  return (
    <>
      <div css={imageModalStyles.overlay} onClick={onClose} />
      <div css={imageModalStyles.modalContainer}>
        <div css={imageModalStyles.modal}>
          <img
            css={imageModalStyles.image}
            src={image.imageUrl}
            alt={image.tweetText}
            onClick={onClose}
          />
          {image.tweetText && (
            <a css={imageModalStyles.postTextContainer} href={image.tweetLink} target="_blank" rel="noopener noreferrer">
              <span css={imageModalStyles.postText}>{image.tweetText}</span>
            </a>
          )}
        </div>
      </div>
    </>
  );
};

const imageModalStyles: Record<string, CSSObject> = {
  overlay: {
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(6px)',
    zIndex: 2000,
  },
  modalContainer: {
    position: 'fixed',
    inset: '0',
    zIndex: 2001,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'none'
  },
  modal: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '80%',
    maxHeight: '80%',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#181A1D',
    borderRadius: '6px',
    pointerEvents: 'auto'
  },
  image: {
    objectFit: 'contain',
    maxWidth: '100%',
    maxHeight: '100%',
    cursor: 'zoom-out',
  },
  postTextContainer: {
    textDecoration: 'none',
    color: 'inherit',
    padding: '8px 4px'
  },
};

export default SummaryImageModal;