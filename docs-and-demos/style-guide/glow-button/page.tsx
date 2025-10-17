import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowButton } from '@/components/ui/glow-button';

export default function GlowButtonStyleGuidePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Glow Button</h1>
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
        </CardHeader>
        <CardContent className="bg-black flex items-center justify-center p-10">
          <GlowButton>Click Me</GlowButton>
        </CardContent>
      </Card>
    </div>
  );
} 