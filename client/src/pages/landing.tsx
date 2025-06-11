import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import lightBgLogo from "@/assets/logo/Logo for light background.png";
import darkBgLogo from "@/assets/logo/Logo for dark bg.png";
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
  Sun,
  Timer
} from "lucide-react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const { theme, setTheme } = useTheme();

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Write freely, organise later",
      description: "Brain dump without barriers. Rich text editor with contextual highlighting that turns scattered thoughts into structured tasks when you're ready."
    },
    {
      icon: <CheckSquare className="h-8 w-8" />,
      title: "Everything in one view",
      description: "Personal productivity board that adapts to how you work. Notes, tasks, calendar, and insights in a unified, resizable layout."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Honest AI guidance",
      description: "AI trained to be genuinely helpful, not endlessly encouraging. Provides clarity and perspective without inflating your ego or pretending to be your friend."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Privacy by design",
      description: "Optional contextual memory stores only metadata, never raw content. Conversations auto-delete after 3 days (customisable). You remain unidentifiable."
    },
    {
      icon: <Timer className="h-8 w-8" />,
      title: "Your feedback shapes everything",
      description: "Chrome extension coming soon, then your votes steer the roadmap. Early access feedback earns credits and directly influences development."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Early access advantage",
      description: "Free until official launch. Be part of building something genuinely useful rather than feature-bloated. Quality over quantity."
    }
  ];

  const benefits = [
    "Early access completely free until official launch",
    "Earn credits by providing feedback that shapes development",
    "Privacy-first design with auto-deleting conversations",
    "Humanistic AI that provides thoughtful guidance, not flattery",
    "Community-driven roadmap where your votes matter"
  ];

  return (
    <div className="bg-white dark:bg-black transition-colors duration-300">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-black backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src={theme === "dark" ? darkBgLogo : lightBgLogo} alt="t0by" className="h-8" />
          </a>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                Dashboard
              </Button>
            </Link>
            <Button 
              variant="ghost"
              onClick={() => window.location.href = '/api/auth/google'}
              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Sign In with Google
            </Button>
            <Button 
              onClick={() => window.location.href = '/api/auth/google'}
              className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
          🚀 Early Access - Free Until Official Launch
        </Badge>
        <div className="mb-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Meet
          </h1>
          <div className="flex justify-center">
            <img src={theme === "dark" ? darkBgLogo : lightBgLogo} alt="t0by" className="h-16 md:h-20" />
          </div>
        </div>
        <p className="text-xl text-gray-700 dark:text-gray-100 mb-8 max-w-3xl mx-auto">
          A personal productivity board with honest AI guidance. Brain dump freely, organise thoughtfully, act purposefully.
        </p>
        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="px-8 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            onClick={() => window.location.href = '/api/auth/google'}
          >
            Join Early Access with Google
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-200 mt-4">
          Early access is completely free • Provide feedback to earn credits • Help shape the product roadmap
        </p>
      </section>
      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Thoughtful productivity, not overwhelming features
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-100 max-w-2xl mx-auto">
            Transform scattered thoughts into purposeful action. AI that gives honest guidance, not endless encouragement.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="border-0 shadow-lg hover:shadow-xl transition-shadow rounded-lg p-6 overflow-hidden"
              style={{
                backgroundColor: theme === 'dark' ? '#1e293b' : '#f9fafb'
              }}
            >
              <div className="flex flex-col space-y-1.5 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-900 dark:bg-white rounded-lg">
                    <div className="text-white dark:text-gray-900">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white">{feature.title}</h3>
                </div>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-100">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Benefits Section */}
      <section className="bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-sm py-20 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Early access means you shape the future
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-100">{benefit}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button 
                  size="lg"
                  className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  onClick={() => window.location.href = '/api/auth/google'}
                >
                  Join Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors duration-300">
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Product Screenshot</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard overview showing<br />notes, tasks, and AI chat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Product Screenshots Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            See it in action
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-100 max-w-2xl mx-auto">
            A glimpse of the thoughtful design and functionality you'll experience.
          </p>
        </div>
        
        <div className="space-y-16">
          {/* Writing Experience Screenshot */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rich writing that feels natural</h3>
              <p className="text-gray-700 dark:text-gray-100 mb-6">
                Write freely with our powerful editor. Contextual highlighting helps you spot important thoughts that could become tasks or projects.
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Rich text formatting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Contextual highlighting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Brain dump to structure</span>
                </li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg relative">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">Note Editor</span>
                </div>
              </div>
              
              <div className="min-h-64 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 relative">
                <div className="prose dark:prose-invert max-w-none">
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Project Ideas for Q2</h2>
                  
                  <div className="text-gray-700 dark:text-gray-300 mb-4 relative">
                    <p className="mb-0">
                      Had some thoughts during my morning walk about what we should focus on next quarter. 
                      <span className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                        Need to discuss with team
                      </span> 
                      the feasibility of these ideas.
                    </p>
                    {/* Floating contextual menu */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 flex items-center gap-2">
                      <button className="hover:bg-gray-700 px-2 py-1 rounded">💬 Discussion</button>
                      <button className="hover:bg-gray-700 px-2 py-1 rounded">📋 Task</button>
                      <button className="hover:bg-gray-700 px-2 py-1 rounded">📅 Schedule</button>
                    </div>
                  </div>
                  
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li className="text-gray-700 dark:text-gray-300">
                      <span className="bg-blue-200 dark:bg-blue-800 px-1 rounded">Research competitor pricing</span> - 
                      this could be crucial for our positioning
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      User interview sessions - 
                      <span className="bg-green-200 dark:bg-green-800 px-1 rounded">Schedule for next week</span>
                    </li>
                    <li className="text-gray-700 dark:text-gray-300">
                      Mobile app prototype - still weighing the investment
                    </li>
                  </ul>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <span className="text-gray-400">/</span> Type / for commands or just write naturally...
                  </p>
                  
                  {/* Slash command menu */}
                  <div className="absolute bottom-16 left-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 w-64 z-20">
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">Quick Commands</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <span className="text-blue-500">📝</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Add Task</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Create a new task</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <span className="text-green-500">📅</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Schedule</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Add to calendar</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <span className="text-purple-500">💭</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">AI Insight</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Get AI perspective</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      💡 Contextual highlighting detected 3 potential tasks in this note
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Chat Screenshot */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">AI Conversation</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Honest guidance without<br />false encouragement</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI that tells you the truth</h3>
              <p className="text-gray-700 dark:text-gray-100 mb-6">
                No endless positivity or fake friendships. Our AI provides thoughtful, honest guidance when you need clarity and perspective.
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Emotional clarity</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Honest feedback</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Privacy-focused memory</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to experience mindful productivity?
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-100 mb-8">
            Be part of the early access community. Free access, earn credits through feedback, and help us build something genuinely useful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              Join Early Access
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-gray-900"
              onClick={() => window.location.href = '/api/auth/google'}
            >
              Sign In with Google
            </Button>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-200 dark:bg-gray-950 text-gray-900 dark:text-white py-12 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={theme === "dark" ? darkBgLogo : lightBgLogo} alt="t0by" className="h-6" />
            </div>
            <p className="text-gray-600 dark:text-gray-200">© 2025 t0by. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}