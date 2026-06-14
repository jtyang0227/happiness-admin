import React, { useState } from 'react';
import { Image } from 'lucide-react';

const ImgWithFallback = ({ src, alt, className, style }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface-2)',
          color: 'var(--color-text-tertiary)',
          ...style,
        }}
      >
        <Image size={20} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
};

export default ImgWithFallback;
