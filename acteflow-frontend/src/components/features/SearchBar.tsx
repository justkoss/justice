'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  suggestions?: Array<{ value: string; label: string }>;
  isLoading?: boolean;
  className?: string;
  showClearButton?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  suggestions = [],
  isLoading = false,
  className,
  showClearButton = true,
}: SearchBarProps) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      onSearch?.();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: { value: string; label: string }) => {
    onChange(suggestion.value);
    setShowSuggestions(false);
    onSearch?.();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const hasSuggestions = suggestions.length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (hasSuggestions) setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('search.searchDocuments')}
          className={cn(
            'w-full px-10 py-3 rounded-lg',
            'bg-bg-secondary border border-border',
            'text-text-primary placeholder:text-text-secondary',
            'focus:outline-none focus:ring-2 focus:ring-gold-primary focus:border-transparent',
            'transition-all duration-200',
            isFocused && 'bg-bg-primary'
          )}
        />

        {/* Clear Button */}
        {showClearButton && value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && hasSuggestions && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 w-full mt-2 rounded-lg',
            'bg-bg-secondary border border-border shadow-lg',
            'max-h-64 overflow-y-auto'
          )}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full px-4 py-3 text-left',
                'text-text-primary hover:bg-bg-tertiary',
                'transition-colors duration-150',
                'border-b border-border last:border-b-0',
                'focus:outline-none focus:bg-bg-tertiary'
              )}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-text-secondary" />
                <span>{suggestion.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
