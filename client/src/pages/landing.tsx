import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { 
  CheckCircle, 
  Calendar, 
  FileText, 
  CheckSquare, 
  TrendingUp, 
  Cloud, 
  Zap,
  Users,
  Shield,
  ArrowRight,
  Moon,
  Sun
} from "lucide-react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const { theme, setTheme } = useTheme();

  const features = [
    {
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      title: "Smart Notes",
      description: "AI-powered note-taking with intelligent organization and search capabilities."
    },
    {
      icon: <CheckSquare className="h-8 w-8 text-green-600" />,
      title: "Task Management",
      description: "Prioritize and track tasks with smart deadlines and progress monitoring."
    },
    {
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      title: "Calendar Integration",
      description: "Seamlessly sync with Google Calendar for unified schedule management."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
      title: "Finance Tracking",
      description: "Monitor income, expenses, and financial goals with intelligent insights."
    },
    {
      icon: <Cloud className="h-8 w-8 text-cyan-600" />,
      title: "Weather Insights",
      description: "Real-time weather data to help plan your day effectively."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "AI Assistant",
      description: "Conversational AI that learns your preferences and optimizes your workflow."
    }
  ];

  const benefits = [
    "Increase productivity by 40% with AI-powered insights",
    "Unified dashboard for all your productivity needs",
    "Seamless integrations with Google Calendar and more",
    "Advanced analytics and progress tracking",
    "Enterprise-grade security and privacy"
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              t0by
            </span>
          </a>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button 
              variant="ghost"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              Sign In with Google
            </Button>
            <Button 
              onClick={() => window.location.href = '/api/auth/google'}
            >
              Get Started
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/api/auth/dev-login'}
              className="text-xs"
            >
              Dev Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          ✨ AI-Powered Productivity Platform
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Meet
          <div className="flex justify-center mt-4">
            <img src={theme === "dark" ? whiteLogo : blackLogo} alt="t0by" className="h-16 md:h-20" />
          </div>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Your AI-powered productivity companion. Smart task management, intelligent scheduling, and seamless workflow optimization 
          designed for the modern professional.
        </p>
        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="px-8"
            onClick={() => window.location.href = '/api/auth/google'}
          >
            Start Free Trial with Google
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Free 14-day trial • No credit card required • Cancel anytime
        </p>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need to stay productive
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Our comprehensive suite of tools adapts to your workflow and learns from your habits.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <CardTitle className="text-lg text-gray-900 dark:text-white">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why thousands of professionals choose t0by
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 dark:text-gray-300">{benefit}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/api/auth/google'}
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center space-x-4 mb-6">
                  <Users className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">10,000+</p>
                    <p className="text-blue-100">Active Users</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mb-6">
                  <Shield className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">99.9%</p>
                    <p className="text-blue-100">Uptime</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <TrendingUp className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">40%</p>
                    <p className="text-blue-100">Productivity Increase</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to transform your productivity?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of professionals who have already revolutionized their workflow with t0by.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              Sign In with Google
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-slate-950 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={theme === "dark" ? whiteLogo : blackLogo} alt="t0by" className="h-6" />
            </div>
            <p className="text-gray-400 dark:text-gray-500">© 2025 t0by. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}