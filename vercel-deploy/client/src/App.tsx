import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider } from "@/hooks/use-chat-context";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import StyleGuide from "@/pages/style-guide-fixed";
import SilkTest from "@/pages/silk-test";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/style" component={StyleGuide} />
      <Route path="/silk" component={SilkTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChatProvider>
          <Toaster />
          <Router />
        </ChatProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
