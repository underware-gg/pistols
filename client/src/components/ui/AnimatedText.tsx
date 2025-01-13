import React, { useEffect, useState, useRef } from 'react';

interface AnimatedTextProps {
  text: string;
  delayPerCharacter: number;
  onAnimationComplete?: () => void;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, delayPerCharacter, onAnimationComplete }) => {
  const [spans, setSpans] = useState<JSX.Element[]>([]);

  const lastText = useRef(text)

  useEffect(() => {
    if (!text || lastText.current === text) return;

    lastText.current = text

    setSpans([])

    const totalCharacters = text.length;

    const newSpans = [];
    for (let i = 0; i < totalCharacters; i++) {
      const char = text[i];
      if (char === ' ') {
        newSpans.push(char);
      } else {
        newSpans.push(
          <span
            key={i}
            className="animated-character fadeIn"
            style={{
              animationDelay: `${i * delayPerCharacter}ms`,
              WebkitAnimationDelay: `${i * delayPerCharacter}ms`,
              opacity: 0
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
  }, [text]);

  return <div>{spans}</div>;
};

export default AnimatedText;