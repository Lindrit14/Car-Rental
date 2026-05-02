from __future__ import annotations

import logging
import os
from wsgiref.simple_server import make_server

from spyne.server.wsgi import WsgiApplication

from app.service import soap_app
from app.ecb_client import ecb_client

# ==================== Logging ====================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def main():
    """Start the SOAP server."""
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))

    # Pre-load ECB rates on startup
    logger.info("Loading ECB rates on startup...")
    ecb_client.refresh_rates()
    logger.info("ECB rates loaded successfully")

    # Create WSGI application
    wsgi_app = WsgiApplication(soap_app)

    # Start server
    server = make_server(host, port, wsgi_app)
    logger.info("Currency Converter SOAP service running on http://%s:%d", host, port)
    logger.info("WSDL available at http://%s:%d/?wsdl", host, port)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()