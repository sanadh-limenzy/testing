'use client';

import React, { useEffect, useRef, useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { CountryCodes } from "../../config/CountryCodes";
import { StatesConfig } from "../../config/States";
import { showToast } from "../../helpers";
import {
  googlePlaceDetails,
  googlePlaceSearch,
} from "../../helpers/googleService";
import { GoogleAddress, GooglePlaceSuggestion, GooglePlaceDetail } from "../../@types";

interface Props {
  onChange: (address: GoogleAddress | Record<string, never>) => void;
  disabled?: boolean;
  value: string | undefined;
  placeholder?: string;
  mapId?: string;
}

const GoogleMapInput = ({
  onChange,
  disabled,
  value,
  placeholder,
  mapId = "",
}: Props) => {
  const searchInputTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [searchValue, setSearchValue] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const _googlePlaceSearch = async (searchInput: string): Promise<GooglePlaceSuggestion[]> => {
    if (!searchInput.trim()) return [];
    
    try {
      const result = await googlePlaceSearch(searchInput);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchValue(inputValue);

    // Update the parent component with the typed value
    if (onChange) {
      onChange({ street: inputValue } as GoogleAddress);
    }

    if (searchInputTimerRef.current) {
      clearTimeout(searchInputTimerRef.current);
    }

    if (inputValue.trim()) {
      setIsLoading(true);
      searchInputTimerRef.current = setTimeout(async () => {
        const results = await _googlePlaceSearch(inputValue);
        setSuggestions(results);
        setShowSuggestions(true);
        setIsLoading(false);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: GooglePlaceSuggestion) => {
    setSearchValue(suggestion.description);
    setShowSuggestions(false);

    if (!onChange) return;

    try {
      const detail = await googlePlaceDetails(suggestion.place_id) as GooglePlaceDetail;

      if (!detail?.postal) {
        showToast("Invalid Address", "error");
        return;
      }

      const address: GoogleAddress = {
        street: detail.address || "",
        city: detail.city || "",
        county: detail.county || "",
        state: StatesConfig["US"].find(
          (state) => state.name === detail.state
        )?.code || "",
        pinCode: detail.postal || "",
        country: CountryCodes.find(
          (country) => country.name === detail.country
        )?.code || "US",
        description: suggestion.description,
        lat: detail.lat || 0,
        lng: detail.lng || 0,
      };

      onChange(address);
    } catch (error) {
      console.error('Error getting place details:', error);
      showToast("Error loading address details", "error");
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleClear = () => {
    setSearchValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    if (onChange) {
      onChange({} as Record<string, never>);
    }
  };

  useEffect(() => {
    const newValue = value ?? "";
    if (newValue !== searchValue) {
      setSearchValue(newValue);
    }
  }, [value, searchValue]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          id={`google-map-input_${mapId}`}
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder || "Search Address"}
          disabled={disabled}
          className="w-full pr-20"
        />
        {searchValue && !disabled && (
          <Button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            variant="ghost"
            size="sm"
          >
            ×
          </Button>
        )}
        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id || index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="font-medium">{suggestion.description}</div>
              {suggestion.structured_formatting?.secondary_text && (
                <div className="text-xs text-gray-500">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && searchValue.trim() && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-2 text-sm text-gray-500">
            No addresses found
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapInput;
