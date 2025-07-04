import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ListStyleGuidePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">List Styles</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Unordered List</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5">
              <li>List item one</li>
              <li>List item two</li>
              <li>
                List item three
                <ul className="list-disc space-y-2 pl-5 mt-2">
                  <li>Nested item one</li>
                  <li>Nested item two</li>
                </ul>
              </li>
              <li>List item four</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ordered List</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5">
              <li>List item one</li>
              <li>List item two</li>
              <li>
                List item three
                <ol className="list-decimal space-y-2 pl-5 mt-2">
                  <li>Nested item one</li>
                  <li>Nested item two</li>
                </ol>
              </li>
              <li>List item four</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 