import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  SocialQualifyFormSchema,
  type SocialQualifyForm,
  type SocialQualifyResponse,
} from "@shared/schemas";
import { Loader2 } from "lucide-react";

export default function SocialQualifyForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SocialQualifyForm>({
    email: "",
    phone: "",
    redditUsername: "",
    twitterUsername: "",
    youtubeUsername: "",
    facebookUsername: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [matchedCompany, setMatchedCompany] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate form data
      const validatedData = SocialQualifyFormSchema.parse(formData);

      // Submit to API
      const response = await fetch("/api/social-qualify-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      const result: SocialQualifyResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      if (result.success) {
        setSuccess(true);
        setMatchedCompany(result.data?.matchedCompany);
      }
    } catch (err: any) {
      if (err.issues) {
        // Zod validation errors
        setError(err.issues.map((issue: any) => issue.message).join(", "));
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SocialQualifyForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCompanyMatch = () => {
    if (matchedCompany) {
      navigate(`/companies/${matchedCompany.slug}`);
    }
  };

  if (success && matchedCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FD</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                FairDataUse
              </span>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-2xl">❌</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Application Status Update
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Unfortunately, your social media accounts don't qualify for our
                AI training payment program at this time.
              </p>
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">🎉 Good News!</CardTitle>
                <CardDescription className="text-green-700">
                  Based on your Reddit account, you qualify for our side-gigs
                  marketplace where we match you with software companies looking
                  for Reddit reviewers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Your Match
                  </h3>
                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-blue-600">
                      {matchedCompany.name}
                    </h4>
                    <p className="text-gray-600 mb-2">
                      Marketing consultancy helping technology companies
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg p-4">
                      <div>
                        <span className="font-semibold text-green-600">
                          {matchedCompany.payRate}
                        </span>
                        <span className="text-gray-600"> + </span>
                        <span className="font-semibold text-green-600">
                          {matchedCompany.bonus}
                        </span>
                        <span className="text-gray-600">
                          {" "}
                          performance bonus
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCompanyMatch}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3"
                >
                  Click here to learn more
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Check Your Account Eligibility
            </h1>
            <p className="text-lg text-gray-600">
              Connect your social media accounts to see if you qualify for AI
              training payments
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Account Information</CardTitle>
              <CardDescription>
                Please provide your account details. Reddit username is
                required, other platforms are optional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contact Information
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                </div>

                {/* Social Media Accounts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Social Media Accounts
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="reddit" className="flex items-center gap-2">
                      <span>🤖 Reddit Username *</span>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        Required
                      </span>
                    </Label>
                    <Input
                      id="reddit"
                      value={formData.redditUsername}
                      onChange={(e) =>
                        handleInputChange("redditUsername", e.target.value)
                      }
                      placeholder="your_reddit_username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="twitter"
                      className="flex items-center gap-2"
                    >
                      <span>𝕏 Twitter/X Username</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Optional
                      </span>
                    </Label>
                    <Input
                      id="twitter"
                      value={formData.twitterUsername}
                      onChange={(e) =>
                        handleInputChange("twitterUsername", e.target.value)
                      }
                      placeholder="@your_username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="youtube"
                      className="flex items-center gap-2"
                    >
                      <span>▶️ YouTube Channel</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Optional
                      </span>
                    </Label>
                    <Input
                      id="youtube"
                      value={formData.youtubeUsername}
                      onChange={(e) =>
                        handleInputChange("youtubeUsername", e.target.value)
                      }
                      placeholder="@yourchannel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="facebook"
                      className="flex items-center gap-2"
                    >
                      <span>📘 Facebook Username</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Optional
                      </span>
                    </Label>
                    <Input
                      id="facebook"
                      value={formData.facebookUsername}
                      onChange={(e) =>
                        handleInputChange("facebookUsername", e.target.value)
                      }
                      placeholder="your.facebook.username"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking your accounts...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
