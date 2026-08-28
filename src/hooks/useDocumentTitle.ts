import { useEffect } from 'react';

const BASE_TITLE = 'Kartly | Seller Admin';

/**
 * Sets the browser tab title for the page that calls it, restoring the
 * base title on unmount. Without this, every page shared the same
 * static "Kartly | Seller Admin" from index.html — browser tabs,
 * history entries, and bookmarks all looked identical regardless of
 * which page was actually open.
 */
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | ${BASE_TITLE}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
};
