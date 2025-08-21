import { atom } from 'jotai';

// Atom to track if search is active
export const isSearchActiveAtom = atom(false);

// Atom for the raw search input value
export const searchInputValueAtom = atom('');

// Atom for the debounced search value
export const debouncedSearchValueAtom = atom('');

// Atom to handle debouncing logic
let debounceTimer: NodeJS.Timeout | null = null;
export const setDebouncedSearchAtom = atom(
    null,
    (get, set, value: string) => {
        // Update the raw input value immediately
        set(searchInputValueAtom, value);

        // Clear existing timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // Set new timer for debouncing
        debounceTimer = setTimeout(() => {
            set(debouncedSearchValueAtom, value);
        }, 500); // 500ms debounce delay
    }
);

// Atom to reset search state
export const resetSearchAtom = atom(
    null,
    (get, set) => {
        set(isSearchActiveAtom, false);
        set(searchInputValueAtom, '');
        set(debouncedSearchValueAtom, '');
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
    }
); 