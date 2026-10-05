import { useEffect, useRef } from "react";

const TextareaAutoResize = ({ value, onChange, onKeyDown, ...props }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Grow with the content, then switch to an inner scrollbar once the
    // element reaches its CSS max-height (instead of silently clipping text).
    el.style.height = 'auto';
    const maxHeight = parseFloat(getComputedStyle(el).maxHeight) || Infinity;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      {...props}
    />
  );
};
export default TextareaAutoResize;