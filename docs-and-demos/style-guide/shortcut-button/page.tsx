import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShortcutButton } from '@/components/ui/shortcut-button';

export default function ShortcutButtonStyleGuidePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Shortcut Button</h1>
      <Card>
        <CardHeader>
          <CardTitle>Default</CardTitle>
        </CardHeader>
        <CardContent>
          <ShortcutButton shortcut="⌘C">
            Copy
          </ShortcutButton>
        </CardContent>
      </Card>
    </div>
  );
} 