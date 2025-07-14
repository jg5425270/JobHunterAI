import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Target, Mail, TrendingUp, Shield, Clock } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">JobFlow</h1>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-blue-600 text-white">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Automate Your Job Search
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            JobFlow is a comprehensive job application management system that helps you track applications, 
            manage responses, and automate your job search workflow across multiple platforms.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-primary hover:bg-blue-600 text-white px-8 py-4 text-lg"
          >
            Get Started Today
          </Button>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
            <CardHeader>
              <Target className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Application Tracking</CardTitle>
              <CardDescription>
                Keep track of every job application with detailed status updates and progress monitoring.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
            <CardHeader>
              <Mail className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>
                Connect your email to automatically track responses and categorize job-related communications.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Get detailed analytics on your job search performance and optimize your application strategy.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Secure Credentials</CardTitle>
              <CardDescription>
                Safely store your job platform credentials with enterprise-grade encryption.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
            <CardHeader>
              <Clock className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Automated Workflow</CardTitle>
              <CardDescription>
                Set daily application targets and let JobFlow help you maintain consistent job search activity.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-gray-200 hover:border-primary transition-colors">
            <CardHeader>
              <Briefcase className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Multi-Platform Support</CardTitle>
              <CardDescription>
                Support for Upwork, Freelancer, Indeed, LinkedIn, and many other job platforms.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
            <CardContent className="py-16">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Job Search?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of job seekers who are already using JobFlow to streamline their applications 
                and land their dream jobs faster.
              </p>
              <Button 
                onClick={handleLogin}
                size="lg" 
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Start Your Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
