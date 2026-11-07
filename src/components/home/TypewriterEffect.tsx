"use client";

import { useEffect, useState } from "react";

export default function TypewriterEffect({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    setDisplayText("");
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.substring(0, i + 1));
        i += 1;
      } else {
        clearInterval(typingInterval);
      }
    }, 28);

    return () => clearInterval(typingInterval);
  }, [text]);

  return (
    <p className="relative inline-block">
      {displayText}
      <span className="cursor-blink ml-0.5">|</span>
    </p>
  );
}
