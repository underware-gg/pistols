import React, { useEffect, useRef, useState } from 'react';

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
  const ghostRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<JSX.Element[][]>([]);

    const lastText = useRef(text)

  // Measure lines after initial render
  useEffect(() => {
    if (!text || lastText.current === text) return;

    lastText.current = text
    setLines([])

    const chars = Array.from(text);
    const charSpans: { char: string; top: number; index: number }[] = [];

    const ghostSpans = ghostRef.current?.querySelectorAll('span[data-char]');

    if (!ghostSpans || ghostSpans.length === 0) return;

    ghostSpans.forEach((el, i) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      charSpans.push({
        char: el.textContent || '',
        top: Math.round(rect.top),
        index: i,
      });
    });

    const lines: JSX.Element[][] = [];
    let currentLine: JSX.Element[] = [];
    let currentTop = charSpans[0]?.top ?? 0;

    charSpans.forEach(({ char, top, index }) => {
      let charSpan;
      if (char === ' ') {
        charSpan = <span key={index}>{' '}</span>;
      } else {
        const delay = reverse
          ? (text.length - 1 - index) * delayPerCharacter
          : index * delayPerCharacter;

        const animationClass =
          slideDirection === 'top'
            ? 'slideInFromTop'
            : slideDirection === 'bottom'
            ? 'slideInFromBottom'
            : 'fadeIn';

        charSpan = (
          <span
            key={index}
            className={animationClass}
            style={{
              display: 'inline-block',
              animationDelay: `${delay}ms`,
              animationDuration: `${animationDuration}s`,
              WebkitAnimationDelay: `${delay}ms`,
              WebkitAnimationDuration: `${animationDuration}s`,
              opacity: 0,
              ...style,
            }}
          >
            {char}
          </span>
        );
      }

      if (top !== currentTop) {
        lines.push(currentLine);
        currentLine = [charSpan];
        currentTop = top;
      } else {
        currentLine.push(charSpan);
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    setTimeout(() => {
      setLines(lines);
    }, 50)

    const animationTimeout = setTimeout(() => {
      if (onAnimationComplete) onAnimationComplete();
    }, text.length * delayPerCharacter);

    return () => clearTimeout(animationTimeout);
  }, [text, slideDirection, reverse, delayPerCharacter, animationDuration]);

  return (
    <>
      {/* Hidden ghost for measuring layout */}
      <div
        ref={ghostRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          left: '-9999px',
          top: '-9999px',
          whiteSpace: 'pre-wrap',
          width: '100%',
        }}
      >
        {text && Array.from(text).map((char, i) => (
          <span key={i} data-char>
            {char}
          </span>
        ))}
      </div>

      {/* Visible, animated output */}
      <div>
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} style={{ whiteSpace: 'nowrap' }}>
            {line}
          </div>
        ))}
      </div>
    </>
  );
};

export default AnimatedText;