import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnhancedPaydayWidget() {
  return (
    <Card className="bg-card text-card-foreground border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">
          Monthly Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="space-y-3">
          <div className="text-left">
            <div className="text-xs text-text-muted font-medium mb-2">Next Payment</div>
            <div className="text-3xl font-light text-text-primary">
              Dec 15
            </div>
            <div className="text-sm text-text-secondary mb-3">
              in 11 days
            </div>
            <div className="text-xs text-text-muted">
              Rent payment
            </div>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Total monthly</span>
              <span className="text-text-primary">$2,150</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Remaining this month</span>
              <span className="text-text-primary">$850</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}