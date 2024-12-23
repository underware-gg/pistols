import React, { useEffect, useState } from 'react';

const AnimatedText = ({ text, duration, onAnimationComplete }: { text: string, duration: number, onAnimationComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const animateText = async (text) => {
      if (!text) return;

      setIsAnimating(true);
      setDisplayText('');

      const characters = text.split('');
      for (const char of characters) {
        await new Promise(resolve => setTimeout(resolve, duration));
        setDisplayText(prev => prev + char);
      }

      setIsAnimating(false);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    };

    animateText(text);
  }, [text, onAnimationComplete]);

  return (
    <div>
      {displayText}
    </div>
  );
};

export default AnimatedText;