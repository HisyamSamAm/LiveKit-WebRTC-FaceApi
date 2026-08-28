import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { validateRoomCode, roomCodeToRoomId, encodePassphrase } from '@/lib/client-utils';
import { Users, ArrowRight, AlertCircle, Hash, Lock } from 'lucide-react';

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
    <Card className="border border-white/10 bg-[#161616] text-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-lg mx-auto">
      <CardHeader className="text-center pb-4 pt-6">
        <div className="mx-auto mb-3 w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#1f8cf9]">
          <Users className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-semibold text-white">
          Bergabung dengan Kode
        </CardTitle>
        <CardDescription className="text-sm text-neutral-400">
          Masukkan 6 digit kode room yang dibagikan oleh host meeting.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5 p-6 pt-2">
        <div className="space-y-2">
          <Label htmlFor="room-code" className="text-xs font-medium text-neutral-300 flex items-center">
            <Hash className="h-3.5 w-3.5 mr-1.5 text-[#1f8cf9]" />
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
              className="h-12 text-center text-xl font-mono tracking-widest uppercase bg-[#111111] border-white/15 text-white focus:border-[#1f8cf9] rounded-xl"
              maxLength={6}
              autoComplete="off"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Badge variant="outline" className="text-[11px] font-mono bg-white/5 border-white/15 text-neutral-300">
                {code.length}/6
              </Badge>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500">
            Contoh: ABC123, XYZ789, atau M4TH3M
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="passphrase" className="text-xs font-medium text-neutral-300 flex items-center">
            <Lock className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
            Kata Sandi Enkripsi (Opsional)
          </Label>
          <Input
            id="passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hanya jika meeting dilindungi E2EE"
            className="h-10 text-sm bg-[#111111] border-white/15 text-white focus:border-[#1f8cf9] rounded-lg"
          />
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400 py-2.5 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 pt-1">
          <Button
            onClick={handleJoinRoom}
            disabled={code.length !== 6 || isLoading}
            className="w-full h-12 text-sm font-medium bg-[#1f8cf9] hover:bg-[#1a7ad9] disabled:opacity-50 text-white shadow-lg shadow-[#1f8cf9]/20 transition-all rounded-xl"
            size="lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Bergabung...' : 'Masuk ke Meeting'}
          </Button>

          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full h-11 border-white/10 bg-[#1a1a1a] hover:bg-[#222222] text-white rounded-xl text-xs"
              disabled={isLoading}
            >
              Kembali
            </Button>
          )}
        </div>

        <div className="bg-[#121212] rounded-xl p-4 border border-white/10">
          <h4 className="font-medium text-xs text-neutral-300 mb-2 flex items-center">
            <Hash className="h-3.5 w-3.5 mr-1.5 text-[#1f8cf9]" />
            Petunjuk
          </h4>
          <ul className="text-xs text-neutral-400 space-y-1.5">
            <li>• Kode bersifat tidak sensitif huruf besar/kecil (ABC123 = abc123)</li>
            <li>• Pastikan kode yang dimasukkan tepat 6 karakter alfanumerik</li>
            <li>• Masukkan kunci sandi jika ruang meeting diproteksi enkripsi E2EE</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

