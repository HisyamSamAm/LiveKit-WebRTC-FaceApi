import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { validateRoomCode, roomCodeToRoomId, encodePassphrase } from '@/lib/client-utils';
import { Users, ArrowRight, AlertCircle, Hash } from 'lucide-react';

interface JoinByCodeProps {
  onBack?: () => void;
}

export function JoinByCode({ onBack }: JoinByCodeProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (value: string) => {
    // Auto-format: uppercase and limit to 6 characters
    const formattedCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(formattedCode);
    setError('');
  };

  const handleJoinRoom = async () => {
    if (!validateRoomCode(code)) {
      setError('Kode harus 6 karakter (huruf dan angka)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const roomId = roomCodeToRoomId(code);
      
      // Build the room URL
      let roomUrl = `/rooms/${roomId}`;
      if (passphrase.trim()) {
        roomUrl += `#${encodePassphrase(passphrase)}`;
      }

      // Navigate to the room
      router.push(roomUrl);
    } catch (err) {
      setError('Gagal bergabung ke room. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleJoinRoom();
    }
  };

  return (
    <Card className="border-2 border-green-200 dark:border-green-800 shadow-2xl bg-gradient-to-br from-card to-green-50/50 dark:to-green-950/20 w-full max-w-lg mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Users className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Bergabung dengan Kode
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Masukkan kode room yang diberikan oleh pembuat meeting.
          <br />
          Kode terdiri dari 6 karakter huruf dan angka.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="room-code" className="text-sm font-medium flex items-center">
            <Hash className="h-4 w-4 mr-2 text-green-600" />
            Kode Room
          </Label>
          <div className="relative">
            <Input
              id="room-code"
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ABC123"
              className="h-12 text-center text-2xl font-mono tracking-wider uppercase"
              maxLength={6}
              autoComplete="off"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Badge variant={code.length === 6 ? "default" : "secondary"} className="text-xs">
                {code.length}/6
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Contoh: ABC123, XYZ789, atau M4TH3M
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="passphrase" className="text-sm font-medium flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
            Kata Sandi Enkripsi (Opsional)
          </Label>
          <Input
            id="passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Jika meeting menggunakan enkripsi E2EE"
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Hanya diperlukan jika meeting menggunakan enkripsi end-to-end
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleJoinRoom}
            disabled={code.length !== 6 || isLoading}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            ) : (
              <ArrowRight className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Bergabung...' : 'Bergabung ke Meeting'}
          </Button>

          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full h-12"
              disabled={isLoading}
            >
              Kembali
            </Button>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border">
          <h4 className="font-medium text-sm mb-2 flex items-center">
            <Hash className="h-4 w-4 mr-2" />
            Tips Menggunakan Kode
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Kode bersifat case-insensitive (ABC123 = abc123)</li>
            <li>• Pastikan kode yang dimasukkan tepat 6 karakter</li>
            <li>• Jika ada enkripsi E2EE, minta kata sandi dari pembuat room</li>
            <li>• Kode room berlaku selama meeting masih aktif</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
