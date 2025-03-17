import React, { useEffect, useState, useRef } from 'react';

interface AnimatedTextProps {
  text: string;
  delayPerCharacter: number;
  onAnimationComplete?: () => void;
  slideDirection?: 'top' | 'bottom';
  style?: React.CSSProperties;
  reverse?: boolean;
  animationDuration?: number;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  text, 
  delayPerCharacter, 
  onAnimationComplete, 
  slideDirection, 
  style, 
  reverse = false,
  animationDuration = 0.5
}) => {
  const [spans, setSpans] = useState<JSX.Element[]>([]);

  const lastText = useRef(text)

  useEffect(() => {
    if (!text || lastText.current === text) return;

    console.log('entered')

    lastText.current = text

    setSpans([])

    const totalCharacters = text.length;

    const newSpans = [];
    for (let i = 0; i < totalCharacters; i++) {
      const char = text[i];
      if (char === ' ') {
        newSpans.push(char);
      } else {
        let animationClass = "fadeIn";
        if (slideDirection === 'top') {
          animationClass = "slideInFromTop";
        } else if (slideDirection === 'bottom') {
          animationClass = "slideInFromBottom";
        }

        const delay = reverse ? 
          ((totalCharacters - 1 - i) * delayPerCharacter) : 
          (i * delayPerCharacter);

        newSpans.push(
          <span
            key={i}
            className={animationClass}
            style={{
              animationDelay: `${delay}ms`,
              WebkitAnimationDelay: `${delay}ms`,
              animationDuration: `${animationDuration}s`,
              WebkitAnimationDuration: `${animationDuration}s`,
              opacity: 0,
              ...style
            }}
          >
            {char}
          </span>
        );
      }
    }

    setTimeout(() => {
      setSpans(newSpans);
    }, 50)

    // Trigger `onComplete` when the last animation is done
    const animationTimeout = setTimeout(() => {
      if (onAnimationComplete) onAnimationComplete();
    }, totalCharacters * delayPerCharacter);

    return () => clearTimeout(animationTimeout); // Cleanup timeout on unmount or when text changes
  }, [text, slideDirection, style, reverse, animationDuration]);

  return <div>{spans}</div>;
};

export default AnimatedText;