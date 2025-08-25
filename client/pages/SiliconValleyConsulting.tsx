import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { ContractorRequestSchema, type ContractorRequest, type ContractorRequestResponse } from "@shared/schemas";

export default function SiliconValleyConsulting() {
  const [loading, setLoading] = useState(false);
  const [joinSlackRequested, setJoinSlackRequested] = useState(false);
  const [canStartJob, setCanStartJob] = useState(false);
  const [message, setMessage] = useState('');

  // Mock user email - in real app this would come from auth context
  const userEmail = "user@example.com"; // This should come from user context/auth

  const handleJoinSlack = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const requestData: ContractorRequest = {
        email: userEmail,
        companySlug: 'silicon-valley-consulting',
        companyName: 'Silicon Valley Consulting'
      };

      const validatedData = ContractorRequestSchema.parse(requestData);
      
      const response = await fetch('/api/contractor-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });
      
      const result: ContractorRequestResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }
      
      if (result.success) {
        setJoinSlackRequested(true);
        setMessage(result.message);
      }
    } catch (err: any) {
      setMessage(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = () => {
    // This would navigate to job dashboard or show job instructions
    alert("Job dashboard coming soon! You'll be able to submit daily tasks and track payments here.");
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
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">← Back to Home</a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Company Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">SVC</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Silicon Valley Consulting</h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <a 
                href="https://SiliconValleyConsulting.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                SiliconValleyConsulting.io
              </a>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A marketing consultancy helping technology companies grow their communities and engagement
            </p>
          </div>

          {/* Compensation */}
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                💰 Compensation Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  $2.00 per hour + $500 performance bonus
                </div>
                <p className="text-green-700">
                  Competitive hourly rate with significant performance incentives
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Tasks */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Tasks</CardTitle>
              <CardDescription>What you'll be doing for our clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Reddit Community Engagement</h4>
                    <p className="text-gray-600">
                      Role play as authentic users for our clients to help them grow their subreddit communities organically.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Content Creation</h4>
                    <p className="text-gray-600">
                      Create authentic posts, comments, and discussions that align with client objectives.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Community Building</h4>
                    <p className="text-gray-600">
                      Help foster genuine discussions and engagement within target communities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Step-by-step process to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Join Company Slack</h4>
                    <p className="text-gray-600">
                      Click the "Join Slack" button below. We'll contact the company to get an invite link sent to you within 72 hours.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Review Getting Started Docs</h4>
                    <p className="text-gray-600">
                      Once you join their Slack, they'll provide comprehensive how-to-get-started documentation. Read through everything carefully.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Start Job & Payment Security</h4>
                    <p className="text-gray-600">
                      Return here and click "Start Job". We'll automatically deduct 1 month's pay from their company account to ensure you get paid.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Daily Task Submission</h4>
                    <p className="text-gray-600">
                      Complete daily tasks and submit proof (links, screenshots) here. A FairDataUse team member will verify within 7 days and release your weekly payment.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Payment Setup</h4>
                    <p className="text-gray-600">
                      After your first payment is released, you'll receive a Stripe link to set up direct deposit for future payments.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          {message && (
            <Alert className="mb-6">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {joinSlackRequested ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Slack Request Sent
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-blue-600" />
                      Join Company Slack
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {joinSlackRequested 
                    ? "We've notified the company. Check your email within 72 hours."
                    : "Request an invitation to the company's Slack workspace"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleJoinSlack}
                  disabled={loading || joinSlackRequested}
                  className="w-full"
                  variant={joinSlackRequested ? "secondary" : "default"}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Requesting...
                    </>
                  ) : joinSlackRequested ? (
                    'Request Sent ✓'
                  ) : (
                    'Join Slack'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {canStartJob ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Ready to Start
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-gray-400" />
                      Start Job
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {canStartJob 
                    ? "The company has approved you as a contractor"
                    : "Available after company approval"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleStartJob}
                  disabled={!canStartJob}
                  className="w-full"
                  variant={canStartJob ? "default" : "secondary"}
                >
                  {canStartJob ? 'Start Job' : 'Waiting for Approval'}
                </Button>
                {!canStartJob && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This button will be enabled once the company accepts you as a contractor
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-xl">🔒</div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Payment Protection</h4>
                  <p className="text-blue-800 text-sm">
                    FairDataUse holds company funds in escrow to guarantee your payment. You'll only work after we've secured payment for your services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
