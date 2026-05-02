from __future__ import annotations

import hmac
import os
import logging
from spyne import Fault

logger = logging.getLogger(__name__)

API_KEY = os.environ.get("CURRENCY_API_KEY")
if not API_KEY:
    raise RuntimeError("CURRENCY_API_KEY environment variable must be set")


class AuthenticationFault(Fault):
    """SOAP Fault for authentication errors."""

    def __init__(self, message):
        super().__init__(
            faultcode="Client.AuthenticationError",
            faultstring=message
        )


def validate_api_key(ctx) -> bool:
    """
    Validate the API key from the SOAP header or HTTP header.
    Raises a SOAP Fault if invalid.
    """
    api_key = None

    # Check SOAP header first
    if ctx.in_header is not None:
        header = ctx.in_header
        # in_header comes as a list when defined as tuple
        if isinstance(header, (list, tuple)):
            header = header[0] if header else None
        if header is not None and hasattr(header, 'ApiKey'):
            api_key = header.ApiKey

    # Fallback: check HTTP X-API-Key header
    if api_key is None and hasattr(ctx, 'transport') and hasattr(ctx.transport, 'req_env'):
        api_key = ctx.transport.req_env.get('HTTP_X_API_KEY')

    if api_key is None:
        logger.warning("Request without API key")
        raise AuthenticationFault("API key is required. Provide it in the SOAP header as ApiKey.")

    if not hmac.compare_digest(api_key, API_KEY):
        logger.warning("Invalid API key attempt")
        raise AuthenticationFault("Invalid API key.")

    logger.debug("API key validated successfully")
    return True