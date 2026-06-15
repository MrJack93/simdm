import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

/**
 * Popover component - floating content trigger with click-outside handling
 * Useful for device info previews, tooltips with content
 */
export function Popover({ children }) {
  return <>{children}</>;
}

export function PopoverTrigger({ asChild, children, onClick, ...props }) {
  if (asChild && typeof children?.type === "function") {
    return children;
  }
  return (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function PopoverContent({ children, className = "", side = "bottom" }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const triggerRef = useRef(null);

  const sideClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      {isOpen && (
        <div
          ref={contentRef}
          className={`absolute z-50 rounded-lg border shadow-lg p-3 bg-[var(--color-bg-secondary)] border-[var(--color-border)] min-w-[200px] ${sideClasses[side]} ${className}`}
        >
          {children}
        </div>
      )}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:opacity-70"
      >
        ?
      </button>
    </div>
  );
}
