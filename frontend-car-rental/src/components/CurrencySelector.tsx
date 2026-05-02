import { useCurrency } from "../context/CurrencyContext";

export default function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency();
  const options = currencies.length > 0 ? currencies : [currency];

  return (
    <label className="flex items-center gap-1.5 text-sm text-gray-700">
      <span className="text-gray-500" aria-hidden="true">
        <GlobeIcon />
      </span>
      <span className="sr-only">Currency</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="bg-transparent border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        {options.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0 -18" />
    </svg>
  );
}
