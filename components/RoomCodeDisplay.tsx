import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  Share2, 
  QrCode, 
  Users, 
  CheckCircle, 
  ExternalLink,
  Hash,
  Shield
} from 'lucide-react';

interface RoomCodeDisplayProps {
  roomCode: string;
  roomUrl: string;
  hasE2EE?: boolean;
  passphrase?: string;
  onStartMeeting: () => void;
}

export function RoomCodeDisplay({ 
  roomCode, 
  roomUrl, 
  hasE2EE = false, 
  passphrase,
  onStartMeeting 
}: RoomCodeDisplayProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPassphrase, setCopiedPassphrase] = useState(false);

  const copyToClipboard = async (text: string, type: 'code' | 'url' | 'passphrase') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') setCopiedCode(true);
      if (type === 'url') setCopiedUrl(true);
      if (type === 'passphrase') setCopiedPassphrase(true);
      
      setTimeout(() => {
        setCopiedCode(false);
        setCopiedUrl(false);
        setCopiedPassphrase(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareRoom = async () => {
    const shareData = {
      title: 'Bergabung ke KolabEmpati Meeting',
      text: `Kode Room: ${roomCode}${hasE2EE ? '\nMeeting ini menggunakan enkripsi E2EE.' : ''}`,
      url: roomUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        const shareText = `Bergabung ke KolabEmpati Meeting\n\nKode Room: ${roomCode}\nLink: ${roomUrl}${hasE2EE ? '\n\n🔒 Meeting ini menggunakan enkripsi E2EE' : ''}`;
        await navigator.clipboard.writeText(shareText);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-2xl bg-gradient-to-br from-card to-blue-50/50 dark:to-blue-950/20 w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Users className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Room Berhasil Dibuat!
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Bagikan kode ini kepada peserta lain untuk bergabung ke meeting Anda.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Room Code Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Hash className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Kode Room</span>
            </div>
            
            <div className="relative">
              <div className="text-5xl font-black tracking-[0.3em] text-blue-600 dark:text-blue-400 font-mono">
                {roomCode}
              </div>
              <Button
                onClick={() => copyToClipboard(roomCode, 'code')}
                variant="outline"
                size="sm"
                className="absolute -right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                {copiedCode ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="text-xs">
                6 Karakter
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Huruf & Angka
              </Badge>
              {hasE2EE && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                  <Shield className="h-3 w-3 mr-1" />
                  E2EE Aktif
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* E2EE Passphrase (if enabled) */}
        {hasE2EE && passphrase && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-green-800 dark:text-green-400">
                  Meeting menggunakan enkripsi E2EE
                </p>
                <div className="flex items-center justify-between bg-white dark:bg-green-950/50 p-3 rounded-lg border">
                  <span className="font-mono text-sm break-all">{passphrase}</span>
                  <Button
                    onClick={() => copyToClipboard(passphrase, 'passphrase')}
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-8 w-8 p-0"
                  >
                    {copiedPassphrase ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Bagikan kata sandi ini secara aman kepada peserta
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Share Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => copyToClipboard(roomUrl, 'url')}
            variant="outline"
            className="h-12 flex items-center justify-center space-x-2"
          >
            {copiedUrl ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Link Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Salin Link</span>
              </>
            )}
          </Button>

          <Button
            onClick={shareRoom}
            variant="outline"
            className="h-12 flex items-center justify-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Bagikan</span>
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4 border">
          <h4 className="font-medium text-sm mb-3 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Cara Mengundang Peserta
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start space-x-2">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
              <span>Bagikan kode room: <strong className="font-mono text-foreground">{roomCode}</strong></span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
              <span>Peserta buka KolabEmpati dan pilih "Bergabung dengan Kode"</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
              <span>Masukkan kode dan {hasE2EE ? 'kata sandi enkripsi' : 'langsung bergabung'}</span>
            </div>
          </div>
        </div>

        {/* Start Meeting Button */}
        <Button
          onClick={onStartMeeting}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <ExternalLink className="h-5 w-5 mr-2" />
          Mulai Meeting Sekarang
        </Button>
      </CardContent>
    </Card>
  );
}
