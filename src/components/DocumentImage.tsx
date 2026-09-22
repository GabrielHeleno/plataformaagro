import React, { useState, useEffect } from 'react';
import {
  formatDriveDirectImageUrl,
  formatDriveAlternativeImageUrl,
  getDriveWebLink,
  isGoogleDriveUrl,
  extractDriveFileId,
} from '../utils/driveStorage';
import { ExternalLink, ImageOff } from 'lucide-react';

interface DocumentImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onClick?: () => void;
}

export const DocumentImage: React.FC<DocumentImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full relative',
  referrerPolicy = 'no-referrer',
  onClick,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [attempt, setAttempt] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setCurrentSrc('');
      setHasError(false);
      setAttempt(0);
      return;
    }

    setHasError(false);
    setIsLoaded(false);
    setAttempt(0);

    if (isGoogleDriveUrl(src)) {
      // Primeira tentativa: Thumbnail oficial do Google Drive
      setCurrentSrc(formatDriveDirectImageUrl(src, 1600));
    } else {
      setCurrentSrc(src);
    }
  }, [src]);

  const handleError = () => {
    if (!src) return;

    if (isGoogleDriveUrl(src)) {
      const fileId = extractDriveFileId(src);
      if (attempt === 0) {
        // Segunda tentativa: lh3.googleusercontent.com
        setAttempt(1);
        setCurrentSrc(formatDriveAlternativeImageUrl(src));
        return;
      } else if (attempt === 1 && fileId) {
        // Terceira tentativa: uc?export=view
        setAttempt(2);
        setCurrentSrc(`https://drive.google.com/uc?export=view&id=${fileId}`);
        return;
      }
    }

    setHasError(true);
  };

  const webLink = isGoogleDriveUrl(src) ? getDriveWebLink(src) : src;

  if (hasError) {
    return (
      <div
        className={`${containerClassName} flex flex-col items-center justify-center bg-zinc-100 text-zinc-500 p-2 text-center text-xs select-none`}
        onClick={onClick}
      >
        <ImageOff className="w-5 h-5 text-zinc-400 mb-1" />
        <span className="text-[11px] font-medium leading-tight">Documento no Drive</span>
        {webLink && webLink.startsWith('http') && (
          <a
            href={webLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5"
          >
            <span>Ver no Drive</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={containerClassName} onClick={onClick}>
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-80'}`}
        referrerPolicy={referrerPolicy}
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};
