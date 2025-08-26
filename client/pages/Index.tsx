import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";

interface PlatformData {
  name: string;
  icon: string;
  payPerAccess: number;
  frequency: string;
  isHot?: boolean;
}

interface CurrencyRate {
  code: string;
  symbol: string;
  rate: number;
}

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currency, setCurrency] = useState<CurrencyRate>({
    code: "USD",
    symbol: "$",
    rate: 1,
  });
  const [loading, setLoading] = useState(true);

  const platforms: PlatformData[] = [
    {
      name: "Twitter",
      icon: "𝕏",
      payPerAccess: 1.0,
      frequency: "Every couple of months",
    },
    {
      name: "YouTube",
      icon: "▶️",
      payPerAccess: 2.0,
      frequency: "Every couple of months",
    },
    {
      name: "Facebook",
      icon: "📘",
      payPerAccess: 1.5,
      frequency: "Every couple of months",
    },
    {
      name: "Reddit",
      icon: "🤖",
      payPerAccess: 5.0,
      frequency: "Daily",
      isHot: true,
    },
  ];

  useEffect(() => {
    // Get user's location and currency based on IP with robust error handling
    const detectCurrency = async () => {
      try {
        // First try to get location data with timeout
        const locationController = new AbortController();
        const locationTimeout = setTimeout(() => locationController.abort(), 3000);

        const response = await fetch("https://ipapi.co/json/", {
          signal: locationController.signal,
          headers: {
            'Accept': 'application/json',
          }
        });

        clearTimeout(locationTimeout);

        if (!response.ok) {
          throw new Error(`Location API responded with ${response.status}`);
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
              CHF: "Fr",
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
      } catch (error) {
        // Handle different types of errors gracefully
        if (error.name === 'AbortError') {
          console.warn("Currency detection timed out, using USD");
        } else if (error instanceof TypeError && error.message.includes('NetworkError')) {
          console.warn("Network error during currency detection, using USD");
        } else {
          console.warn("Currency detection failed:", error.message, "- using USD");
        }

        // Always fall back to USD on any error
        setCurrency({
          code: "USD",
          symbol: "$",
          rate: 1,
        });
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent immediate API calls on page load
    const timer = setTimeout(detectCurrency, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    const converted = (amount * currency.rate).toFixed(2);
    return `${currency.symbol}${converted}`;
  };

  const handleCTAClick = () => {
    navigate("/social-qualify-form");
  };

  const handleLearnMoreClick = () => {
    const platformsSection = document.getElementById("platforms");
    if (platformsSection) {
      platformsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FD</span>
            </div>
            <span className="text-xl font-bold text-gray-900">FairDataUse</span>
          </div>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-6">
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                How it works
              </a>
              <a
                href="#platforms"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Platforms
              </a>
              {user && (
                <a
                  href="/marketplace"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Companies
                </a>
              )}
            </nav>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Get Paid When AI Companies
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
              {" "}
              Train on Your Data
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your public social media posts are being used to train AI models.
            Companies like OpenAI should pay you for this. We make it happen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleCTAClick}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              See if your accounts qualify
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-3 text-lg"
              onClick={handleLearnMoreClick}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Payment Chart Section */}
      <section id="platforms" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Platform Payment Rates
            </h2>
            <p className="text-lg text-gray-600">
              See how much you can earn from each social media platform
              {currency.code !== "USD" && (
                <span className="block text-sm text-blue-600 mt-1">
                  Prices shown in {currency.code} (converted from USD)
                </span>
              )}
            </p>
          </div>

          <div className="grid gap-4 md:gap-6">
            {platforms.map((platform, index) => (
              <Card
                key={platform.name}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${platform.isHot ? "ring-2 ring-orange-500 shadow-lg" : ""}`}
              >
                {platform.isHot && (
                  <div className="absolute top-0 right-0">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 rounded-none rounded-bl-lg">
                      🔥 HOTTEST OPTION
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-3xl">{platform.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {platform.name}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {platform.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl md:text-3xl font-bold text-green-600">
                        {loading
                          ? "$--"
                          : formatCurrency(platform.payPerAccess)}
                      </div>
                      <div className="text-sm text-gray-500">per access</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 text-xl">ℹ️</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  How payments work
                </h4>
                <p className="text-blue-800 text-sm">
                  Payments are calculated based on how frequently AI companies
                  access your public posts for training. Reddit offers daily
                  payments because of its high-value discussion format, while
                  other platforms batch payments quarterly due to processing
                  costs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
              How FairDataUse Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect Accounts</h3>
                <p className="text-gray-600">
                  Link your social media accounts securely to track AI company
                  usage
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Monitor Usage</h3>
                <p className="text-gray-600">
                  We track when AI companies access your public data for
                  training
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Paid</h3>
                <p className="text-gray-600">
                  Receive payments directly to your account based on usage
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Paid?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of users already earning from their social media data
          </p>
          <Button
            onClick={handleCTAClick}
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
          >
            See if your accounts qualify
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FD</span>
                </div>
                <span className="text-xl font-bold">FairDataUse</span>
              </div>
              <div className="flex space-x-6 text-sm">
                <a
                  href="#privacy"
                  className="hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#terms"
                  className="hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#contact"
                  className="hover:text-blue-400 transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
              <p>
                &copy; 2024 FairDataUse.com. Making AI training fair for
                everyone.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
