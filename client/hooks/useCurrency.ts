import { useState, useEffect } from 'react';

export interface CurrencyRate {
  code: string;
  symbol: string;
  rate: number;
}

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyRate>({
    code: "USD",
    symbol: "$",
    rate: 1,
  });
  const [currencyLoading, setCurrencyLoading] = useState(true);

  useEffect(() => {
    // Get user's location and currency based on IP with robust error handling
    const detectCurrency = async () => {
      try {
        // First try to get location data with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`IP API responded with ${response.status}`);
        }

        const data = await response.json();

        if (data.currency && data.currency !== "USD") {
          // Try to get exchange rate with timeout
          const exchangeController = new AbortController();
          const exchangeTimeout = setTimeout(() => exchangeController.abort(), 3000);

          const exchangeResponse = await fetch(
            `https://api.exchangerate-api.com/v4/latest/USD`,
            {
              signal: exchangeController.signal,
              headers: {
                'Accept': 'application/json',
              }
            }
          );

          clearTimeout(exchangeTimeout);

          if (!exchangeResponse.ok) {
            throw new Error(`Exchange API responded with ${exchangeResponse.status}`);
          }

          const exchangeData = await exchangeResponse.json();

          if (exchangeData.rates && exchangeData.rates[data.currency]) {
            const currencySymbols: { [key: string]: string } = {
              EUR: "€",
              GBP: "£",
              JPY: "¥",
              CAD: "C$",
              AUD: "A$",
              CHF: "Fr.",
              CNY: "¥",
              INR: "₹",
            };

            setCurrency({
              code: data.currency,
              symbol: currencySymbols[data.currency] || data.currency,
              rate: exchangeData.rates[data.currency],
            });
            console.log(`Currency detected: ${data.currency}`);
          } else {
            console.warn(`Exchange rate not available for ${data.currency}, using USD`);
          }
        } else {
          console.log("Using default USD currency");
        }
      } catch (error: any) {
        // Handle different types of errors gracefully
        if (error.name === 'AbortError') {
          console.warn("Currency detection timed out, using USD");
        } else if (error instanceof TypeError && error.message.includes('NetworkError')) {
          console.warn("Network error during currency detection, using USD");
        } else {
          console.warn("Currency detection failed:", error.message, "- using USD");
        }
        // Keep default USD values
      } finally {
        setCurrencyLoading(false);
      }
    };

    detectCurrency();
  }, []);

  const formatCurrency = (amount: number) => {
    const converted = (amount * currency.rate).toFixed(2);
    return `${currency.symbol}${converted}`;
  };

  return {
    currency,
    currencyLoading,
    formatCurrency,
  };
}