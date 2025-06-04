import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const [loaderNumber, setLoaderNumber] = useState<number>(1);

  useEffect(() => {
    // Randomly select one of the 4 loader GIFs
    setLoaderNumber(Math.floor(Math.random() * 4) + 1);
  }, []);

  // Adjusted sizes to account for ~30x30 central content with padding/empty space
  // Making containers larger so the central content appears at intended size
  // Doubled all sizes for better visibility
  const sizeClasses = {
    sm: 'w-32 h-32',    // ~128px container for ~60px visible content (was w-16 h-16)
    md: 'w-48 h-48',    // ~192px container for ~90px visible content (was w-24 h-24)  
    lg: 'w-64 h-64'     // ~256px container for ~120px visible content (was w-32 h-32)
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={`/loaders/${loaderNumber}.gif`}
        alt="Loading..."
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
} 