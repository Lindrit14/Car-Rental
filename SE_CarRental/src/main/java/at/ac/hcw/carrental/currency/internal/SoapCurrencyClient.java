package at.ac.hcw.carrental.currency.internal;

import at.ac.hcw.carrental.shared.exception.ExternalServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.*;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Raw SOAP client for the Currency Converter Python/Spyne service.
 * Sends SOAP XML requests and parses XML responses.
 */
@Slf4j
@Component
public class SoapCurrencyClient {

    @Value("${app.currency.converter-url}")
    private String serviceUrl;

    /**
     * Calls ConvertCurrency SOAP operation.
     */
    public ConvertCurrencyResult convertCurrency(String from, String to, BigDecimal amount) {
        String soapRequest = """
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                                  xmlns:cur="http://currencyconverter.local/">
                    <soapenv:Header>
                        <cur:AuthHeader>
                            <cur:ApiKey>%s</cur:ApiKey>
                        </cur:AuthHeader>
                    </soapenv:Header>
                    <soapenv:Body>
                        <cur:ConvertCurrency>
                            <cur:FromCurrency>%s</cur:FromCurrency>
                            <cur:ToCurrency>%s</cur:ToCurrency>
                            <cur:Amount>%s</cur:Amount>
                        </cur:ConvertCurrency>
                    </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(apiKey, from, to, amount.toPlainString());

        String response = sendSoapRequest(soapRequest);
        return parseConvertResponse(response);
    }

    /**
     * Calls GetSupportedCurrencies SOAP operation.
     */
    public List<String> getSupportedCurrencies() {
        String soapRequest = """
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                                  xmlns:cur="http://currencyconverter.local/">
                    <soapenv:Header>
                        <cur:AuthHeader>
                            <cur:ApiKey>%s</cur:ApiKey>
                        </cur:AuthHeader>
                    </soapenv:Header>
                    <soapenv:Body>
                        <cur:GetSupportedCurrencies/>
                    </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(apiKey);

        String response = sendSoapRequest(soapRequest);
        return parseSupportedCurrencies(response);
    }

    /**
     * Calls GetRateMetadata SOAP operation.
     */
    public RateMetadataResult getRateMetadata() {
        String soapRequest = """
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                                  xmlns:cur="http://currencyconverter.local/">
                    <soapenv:Header>
                        <cur:AuthHeader>
                            <cur:ApiKey>%s</cur:ApiKey>
                        </cur:AuthHeader>
                    </soapenv:Header>
                    <soapenv:Body>
                        <cur:GetRateMetadata/>
                    </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(apiKey);

        String response = sendSoapRequest(soapRequest);
        return parseRateMetadata(response);
    }

    // ==================== Configuration ====================

    @Value("${app.currency.api-key:converter-secret-key}")
    private String apiKey;

    // ==================== HTTP Transport ====================

    private String sendSoapRequest(String soapXml) {
        try {
            String endpoint = serviceUrl.replace("?wsdl", "");

            URL url = URI.create(endpoint).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "text/xml; charset=utf-8");
            conn.setDoOutput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);

            // Send request
            try (OutputStream os = conn.getOutputStream()) {
                os.write(soapXml.getBytes(StandardCharsets.UTF_8));
            }

            // Read response
            int responseCode = conn.getResponseCode();
            InputStream is = (responseCode >= 200 && responseCode < 300)
                    ? conn.getInputStream()
                    : conn.getErrorStream();

            if (is == null) {
                throw new ExternalServiceException(
                        "Currency converter returned status " + responseCode + " with no response body");
            }

            String responseBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            if (responseCode >= 300) {
                log.error("SOAP request failed with status {}: {}", responseCode, responseBody);
                throw new ExternalServiceException("Currency converter returned status " + responseCode);
            }

            return responseBody;

        } catch (IOException e) {
            log.error("Failed to connect to currency converter at {}", serviceUrl, e);
            throw new ExternalServiceException("Currency converter unavailable", e);
        }
    }

    // ==================== XML Parsing ====================

    private ConvertCurrencyResult parseConvertResponse(String xml) {
        try {
            Document doc = parseXml(xml);

            return ConvertCurrencyResult.builder()
                    .originalAmount(getBigDecimalValue(doc, "OriginalAmount"))
                    .convertedAmount(getBigDecimalValue(doc, "ConvertedAmount"))
                    .exchangeRate(getBigDecimalValue(doc, "ExchangeRate"))
                    .fromCurrency(getTextValue(doc, "FromCurrency"))
                    .toCurrency(getTextValue(doc, "ToCurrency"))
                    .rateDate(getTextValue(doc, "RateDate"))
                    .stale(Boolean.parseBoolean(getTextValue(doc, "Stale")))
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse ConvertCurrency response", e);
            throw new ExternalServiceException("Failed to parse currency conversion response", e);
        }
    }

    private List<String> parseSupportedCurrencies(String xml) {
        try {
            Document doc = parseXml(xml);
            List<String> currencies = new ArrayList<>();

            // Spyne wraps string arrays in <string> elements
            NodeList nodes = doc.getElementsByTagNameNS("*", "string");
            for (int i = 0; i < nodes.getLength(); i++) {
                String text = nodes.item(i).getTextContent();
                if (text != null && text.length() == 3) {
                    currencies.add(text);
                }
            }

            return currencies;

        } catch (Exception e) {
            log.error("Failed to parse GetSupportedCurrencies response", e);
            throw new ExternalServiceException("Failed to parse supported currencies response", e);
        }
    }

    private RateMetadataResult parseRateMetadata(String xml) {
        try {
            Document doc = parseXml(xml);

            return RateMetadataResult.builder()
                    .source(getTextValue(doc, "Source"))
                    .lastRefresh(getTextValue(doc, "LastRefresh"))
                    .rateDate(getTextValue(doc, "RateDate"))
                    .stale(Boolean.parseBoolean(getTextValue(doc, "Stale")))
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse GetRateMetadata response", e);
            throw new ExternalServiceException("Failed to parse rate metadata response", e);
        }
    }

    // ==================== XML Helpers ====================

    private Document parseXml(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        // Security: disable external entities
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        return builder.parse(new InputSource(new StringReader(xml)));
    }

    private String getTextValue(Document doc, String tagName) {
        // Try namespace-aware first
        NodeList nodes = doc.getElementsByTagNameNS("*", tagName);
        if (nodes.getLength() == 0) {
            nodes = doc.getElementsByTagName(tagName);
        }
        if (nodes.getLength() > 0) {
            return nodes.item(0).getTextContent();
        }
        return null;
    }

    private BigDecimal getBigDecimalValue(Document doc, String tagName) {
        String value = getTextValue(doc, tagName);
        return value != null ? new BigDecimal(value) : BigDecimal.ZERO;
    }

    // ==================== Internal Result Types ====================

    @lombok.Builder
    @lombok.Data
    public static class ConvertCurrencyResult {
        private BigDecimal originalAmount;
        private BigDecimal convertedAmount;
        private BigDecimal exchangeRate;
        private String fromCurrency;
        private String toCurrency;
        private String rateDate;
        private boolean stale;
    }

    @lombok.Builder
    @lombok.Data
    public static class RateMetadataResult {
        private String source;
        private String lastRefresh;
        private String rateDate;
        private boolean stale;
    }
}