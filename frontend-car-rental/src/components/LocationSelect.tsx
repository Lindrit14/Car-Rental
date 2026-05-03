import { useEffect, useMemo, useRef, useState } from "react";
import { getLocations, type Location, type LocationType } from "../api/locations";

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const TYPE_LABEL: Record<LocationType, string> = {
  airport: "Airports",
  capital: "Capitals",
  bus_terminal: "Bus terminals",
};

const TYPE_ORDER: LocationType[] = ["airport", "capital", "bus_terminal"];

export default function LocationSelect({
  value,
  onChange,
  placeholder = "Pick an airport, city or station",
  className = "",
  required = false,
}: LocationSelectProps) {
  const [items, setItems] = useState<Location[] | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getLocations()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const grouped = useMemo(() => {
    const out: Record<LocationType, Location[]> = {
      airport: [],
      capital: [],
      bus_terminal: [],
    };
    if (!items) return out;
    const needle = value.trim().toLowerCase();
    const filtered = needle
      ? items.filter(
          (l) =>
            l.displayName.toLowerCase().includes(needle) ||
            l.city.toLowerCase().includes(needle),
        )
      : items;
    for (const l of filtered) out[l.type].push(l);
    return out;
  }, [items, value]);

  const flatVisible: Location[] = useMemo(
    () => TYPE_ORDER.flatMap((t) => grouped[t]),
    [grouped],
  );

  function pick(loc: Location) {
    onChange(loc.displayName);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < flatVisible.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : flatVisible.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && flatVisible[activeIndex]) {
      e.preventDefault();
      pick(flatVisible[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
      />
      {open && items !== null && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {flatVisible.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              {items.length === 0 ? "Locations unavailable" : "No matches"}
            </li>
          ) : (
            TYPE_ORDER.map((t) =>
              grouped[t].length > 0 ? (
                <li key={t}>
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase text-gray-500 bg-gray-50">
                    {TYPE_LABEL[t]}
                  </div>
                  {grouped[t].map((l) => {
                    const idx = flatVisible.indexOf(l);
                    return (
                      <div
                        key={l.id}
                        onMouseDown={() => pick(l)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`px-3 py-2 text-sm cursor-pointer ${
                          idx === activeIndex
                            ? "bg-cyan-50 text-cyan-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {l.displayName}
                      </div>
                    );
                  })}
                </li>
              ) : null,
            )
          )}
        </ul>
      )}
    </div>
  );
}
