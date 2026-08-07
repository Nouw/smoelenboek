'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Input } from '@repo/ui/components/input';
import { Loader2, Search, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useId,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

import { trpc } from '@/app/trpc';
import { useI18n } from '@/lib/i18n';

const minimumQueryLength = 2;
const debounceMilliseconds = 250;

export function MemberSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const canSearch = debouncedQuery.trim().length >= minimumQueryLength;
  const users = trpc.user.search.useQuery(
    { query: debouncedQuery },
    { enabled: canSearch, retry: false },
  );
  const results = users.data ?? [];

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      debounceMilliseconds,
    );

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  function openProfile(userId: string) {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    router.push(`/profile/${userId}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!canSearch || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? results.length - 1 : current - 1,
      );
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const selectedUser = results[activeIndex];
      if (selectedUser) openProfile(selectedUser.id);
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const showResults = isOpen && query.trim().length >= minimumQueryLength;
  const activeOption = activeIndex >= 0 ? results[activeIndex] : undefined;

  return (
    <div
      className="relative w-full max-w-sm sm:max-w-md lg:max-w-xl"
      onBlur={handleBlur}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        placeholder={t('memberSearch.placeholder')}
        className="h-9 rounded-full bg-muted/40 pr-9 pl-9 shadow-none"
        aria-label={t('memberSearch.label')}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showResults}
        aria-activedescendant={
          activeOption ? `${listboxId}-${activeOption.id}` : undefined
        }
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {users.isFetching && canSearch ? (
        <Loader2 className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}

      {showResults ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t('memberSearch.results')}
          className="absolute top-full right-0 left-0 mt-2 max-h-80 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {!canSearch || debouncedQuery !== query.trim() || users.isLoading ? (
            <SearchStatus loading text={t('memberSearch.searching')} />
          ) : users.isError ? (
            <SearchStatus text={t('memberSearch.error')} />
          ) : results.length === 0 ? (
            <SearchStatus text={t('memberSearch.empty')} />
          ) : (
            results.map((user, index) => (
              <button
                id={`${listboxId}-${user.id}`}
                key={user.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => openProfile(user.id)}
              >
                <Avatar className="size-9">
                  <AvatarImage src={user.imageUrl ?? undefined} alt="" />
                  <AvatarFallback>
                    <UserRound className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {user.name}
                  </span>
                  {user.email ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchStatus({
  loading = false,
  text,
}: {
  loading?: boolean;
  text: string;
}) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground"
      role="status"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {text}
    </div>
  );
}
