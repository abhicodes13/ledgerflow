import { useEffect } from "react";

// Sets the browser tab title while a page is open, then restores the previous one
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
