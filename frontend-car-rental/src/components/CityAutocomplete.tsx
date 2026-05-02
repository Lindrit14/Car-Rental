import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "./GoogleMapsProvider";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

interface Suggestion {
  placeId: string;
  city: string;
  description: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = "Enter a city",
  className = "",
  required = false,
}: CityAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipFetchRef = useRef(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoaded || !value.trim() || skipFetchRef.current) {
      if (skipFetchRef.current) skipFetchRef.current = false;
      if (!value.trim()) setSuggestions([]);
      return;
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }

    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: value,
        types: ["(cities)"],
        sessionToken: sessionTokenRef.current,
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(
            predictions.map((p) => ({
              placeId: p.place_id,
              city: p.structured_formatting?.main_text ?? p.description,
              description: p.description,
            }))
          );
          setShowDropdown(true);
          setActiveIndex(-1);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, [value, isLoaded]);

  function selectSuggestion(suggestion: Suggestion) {
    skipFetchRef.current = true;
    onChange(suggestion.city);
    setSuggestions([]);
    setShowDropdown(false);
    sessionTokenRef.current = null;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              onMouseDown={() => selectSuggestion(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3 py-2 text-sm cursor-pointer ${
                i === activeIndex ? "bg-cyan-50 text-cyan-900" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
