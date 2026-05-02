from __future__ import annotations

from decimal import Decimal
from spyne import (
    Application, Service, Unicode, Float, Boolean, Array,
    rpc, ComplexModel
)
from spyne.protocol.soap import Soap11

from app.ecb_client import ecb_client
from app.auth import validate_api_key


# ==================== SOAP Header Model ====================

class AuthHeader(ComplexModel):
    """SOAP header for API key authentication."""
    __namespace__ = "http://currencyconverter.local/"
    ApiKey = Unicode


# ==================== SOAP Service ====================

class CurrencyConverterService(Service):
    """SOAP service for currency conversion using ECB rates."""

    @rpc(Unicode, Unicode, Float,
         _in_header=(AuthHeader,),
         _returns=(Float, Float, Float, Unicode, Unicode, Unicode, Boolean),
         _out_variable_names=(
             'OriginalAmount', 'ConvertedAmount', 'ExchangeRate',
             'FromCurrency', 'ToCurrency', 'RateDate', 'Stale'
         ))
    def ConvertCurrency(ctx, FromCurrency, ToCurrency, Amount):
        """Convert an amount between two currencies."""
        validate_api_key(ctx)

        if Amount is None or Amount <= 0:
            raise ValueError("Amount must be positive")
        if not FromCurrency or not ToCurrency:
            raise ValueError("FromCurrency and ToCurrency are required")

        result = ecb_client.convert(
            Decimal(str(Amount)),
            FromCurrency,
            ToCurrency
        )

        return (
            result["original_amount"],
            result["converted_amount"],
            result["exchange_rate"],
            result["from_currency"],
            result["to_currency"],
            result["rate_date"],
            result["stale"]
        )

    @rpc(_in_header=(AuthHeader,),
         _returns=(Array(Unicode), Unicode),
         _out_variable_names=('Currencies', 'RateDate'))
    def GetSupportedCurrencies(ctx):
        """Get all supported currency codes."""
        validate_api_key(ctx)

        currencies = ecb_client.get_supported_currencies()
        metadata = ecb_client.get_rate_metadata()

        return currencies, metadata["rate_date"]

    @rpc(_in_header=(AuthHeader,),
         _returns=(Unicode, Unicode, Unicode, Boolean),
         _out_variable_names=('Source', 'RateDate', 'LastRefresh', 'Stale'))
    def GetRateMetadata(ctx):
        """Get metadata about the current exchange rates."""
        validate_api_key(ctx)

        metadata = ecb_client.get_rate_metadata()

        return (
            metadata["source"],
            metadata["rate_date"],
            metadata["last_refresh"],
            metadata["stale"]
        )


# ==================== Spyne Application ====================

soap_app = Application(
    [CurrencyConverterService],
    tns="http://currencyconverter.local/",
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11(),
    name="CurrencyConverterService"
)