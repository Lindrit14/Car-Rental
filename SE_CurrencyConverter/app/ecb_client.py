from __future__ import annotations

import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import logging

logger = logging.getLogger(__name__)

ECB_FEED_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
ECB_NAMESPACE = {"gesmes": "http://www.gesmes.org/xml/2002-08-01",
                 "eurofx": "http://www.ecb.int/vocabulary/2002-08-01/eurofxref"}

# Cache refresh interval
CACHE_TTL_HOURS = 24


class EcbClient:
    """Fetches and caches ECB exchange rates, calculates cross-rates."""

    def __init__(self):
        self._rates: dict[str, Decimal] = {}
        self._rate_date: str | None = None
        self._last_refresh: datetime | None = None

    # ==================== Public API ====================

    def get_rate(self, currency: str) -> Decimal:
        """Get the rate for a currency against EUR."""
        self._ensure_rates_loaded()

        currency = currency.upper()
        if currency == "EUR":
            return Decimal("1")

        if currency not in self._rates:
            raise ValueError(f"Unsupported currency: {currency}")

        return self._rates[currency]

    def convert(self, amount: Decimal, from_currency: str, to_currency: str) -> dict:
        """Convert an amount between any two supported currencies."""
        self._ensure_rates_loaded()

        from_currency = from_currency.upper()
        to_currency = to_currency.upper()

        if from_currency == to_currency:
            return self._build_result(amount, amount, Decimal("1"),
                                      from_currency, to_currency)

        from_rate = self.get_rate(from_currency)
        to_rate = self.get_rate(to_currency)

        # Cross-rate: amount * (to_rate / from_rate)
        exchange_rate = (to_rate / from_rate).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
        converted = (amount * exchange_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return self._build_result(amount, converted, exchange_rate,
                                  from_currency, to_currency)

    def get_supported_currencies(self) -> list[str]:
        """Return all supported currency codes."""
        self._ensure_rates_loaded()
        return sorted(["EUR"] + list(self._rates.keys()))

    def get_rate_metadata(self) -> dict:
        """Return metadata about the current rates."""
        self._ensure_rates_loaded()
        return {
            "source": "European Central Bank",
            "rate_date": self._rate_date,
            "last_refresh": self._last_refresh.isoformat() if self._last_refresh else None,
            "stale": self._is_stale()
        }

    # ==================== Data Fetching ====================

    def refresh_rates(self):
        """Fetch latest rates from ECB."""
        try:
            logger.info("Fetching ECB rates from %s", ECB_FEED_URL)
            response = requests.get(ECB_FEED_URL, timeout=10)
            response.raise_for_status()

            rates, rate_date = self._parse_ecb_xml(response.content)

            self._rates = rates
            self._rate_date = rate_date
            self._last_refresh = datetime.utcnow()

            logger.info("ECB rates refreshed successfully (date=%s, currencies=%d)",
                        rate_date, len(rates))

        except Exception as e:
            logger.error("Failed to fetch ECB rates: %s", e)
            if not self._rates:
                raise RuntimeError("No rates available and ECB fetch failed") from e
            logger.warning("Serving stale rates from %s", self._rate_date)

    # ==================== XML Parsing ====================

    @staticmethod
    def _parse_ecb_xml(xml_content: bytes) -> tuple[dict[str, Decimal], str]:
        """Parse ECB XML feed and return (rates_dict, rate_date)."""
        root = ET.fromstring(xml_content)

        # Find the Cube element with the time attribute
        time_cube = root.find(".//eurofx:Cube/eurofx:Cube[@time]", ECB_NAMESPACE)
        if time_cube is None:
            raise ValueError("Could not find rate data in ECB XML")

        rate_date = time_cube.attrib["time"]
        rates = {}

        for cube in time_cube.findall("eurofx:Cube", ECB_NAMESPACE):
            currency = cube.attrib.get("currency")
            rate = cube.attrib.get("rate")
            if currency and rate:
                rates[currency] = Decimal(rate)

        if not rates:
            raise ValueError("No rates found in ECB XML")

        return rates, rate_date

    # ==================== Internal Helpers ====================

    def _ensure_rates_loaded(self):
        """Load rates if not yet loaded or if cache is expired."""
        if not self._rates or self._is_cache_expired():
            self.refresh_rates()

    def _is_cache_expired(self) -> bool:
        """Check if the cached rates are older than the TTL."""
        if self._last_refresh is None:
            return True
        return datetime.utcnow() - self._last_refresh > timedelta(hours=CACHE_TTL_HOURS)

    def _is_stale(self) -> bool:
        """Rates are stale if they are older than 48 hours."""
        if self._last_refresh is None:
            return True
        return datetime.utcnow() - self._last_refresh > timedelta(hours=48)

    def _build_result(self, original: Decimal, converted: Decimal,
                      rate: Decimal, from_currency: str, to_currency: str) -> dict:
        """Build a standardized conversion result."""
        return {
            "original_amount": float(original),
            "converted_amount": float(converted),
            "exchange_rate": float(rate),
            "from_currency": from_currency,
            "to_currency": to_currency,
            "rate_date": self._rate_date,
            "stale": self._is_stale()
        }


# Singleton instance used by the SOAP service
ecb_client = EcbClient()