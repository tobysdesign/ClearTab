import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ToasterStyleGuidePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Toaster</h1>
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Component preview goes here.</p>
        </CardContent>
      </Card>
    </div>
  );
} 