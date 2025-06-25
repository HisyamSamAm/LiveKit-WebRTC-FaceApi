import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">KolabEmpati - Test Page</h1>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Shadcn Components Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Test Button</Button>
        </CardContent>
      </Card>
    </div>
  );
}
