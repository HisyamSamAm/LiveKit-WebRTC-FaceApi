import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  Share2, 
  CheckCircle2, 
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
    <Card className="border border-white/10 bg-[#161616] text-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-lg mx-auto">
      <CardHeader className="text-center pb-3 pt-6">
        <div className="mx-auto mb-3 w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-semibold text-white">
          Room Berhasil Dibuat
        </CardTitle>
        <CardDescription className="text-sm text-neutral-400">
          Bagikan kode ini atau tautan langsung kepada peserta.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5 p-6 pt-2">
        {/* Terminal Style Room Code Box */}
        <div className="bg-[#0e0e0e] rounded-xl p-5 border border-white/10 text-center space-y-3">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-neutral-400">
            <Hash className="h-3.5 w-3.5 text-[#1f8cf9]" />
            <span>KODE MEETING</span>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <div className="text-4xl font-bold tracking-[0.25em] text-white font-mono">
              {roomCode}
            </div>
            <Button
              onClick={() => copyToClipboard(roomCode, 'code')}
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 rounded-lg bg-white/5 border-white/15 hover:bg-white/10 text-white"
            >
              {copiedCode ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Badge variant="outline" className="text-[11px] bg-white/5 border-white/10 text-neutral-300">
              6 Karakter
            </Badge>
            {hasE2EE && (
              <Badge variant="outline" className="text-[11px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                <Shield className="h-3 w-3 mr-1" />
                E2EE Aktif
              </Badge>
            )}
          </div>
        </div>

        {/* E2EE Passphrase Box */}
        {hasE2EE && passphrase && (
          <div className="bg-[#121212] rounded-xl p-4 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-400 flex items-center">
                <Shield className="h-3.5 w-3.5 mr-1" />
                Kata Sandi E2EE
              </span>
              <Button
                onClick={() => copyToClipboard(passphrase, 'passphrase')}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-neutral-400 hover:text-white"
              >
                {copiedPassphrase ? 'Tersalin' : 'Salin'}
              </Button>
            </div>
            <div className="bg-[#0a0a0a] p-2.5 rounded-lg border border-white/10 font-mono text-xs text-neutral-300 break-all select-all">
              {passphrase}
            </div>
          </div>
        )}

        {/* Share & Copy Link Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => copyToClipboard(roomUrl, 'url')}
            variant="outline"
            className="h-11 text-xs border-white/10 bg-[#1a1a1a] hover:bg-[#222222] text-white rounded-xl flex items-center justify-center space-x-1.5"
          >
            {copiedUrl ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Link Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin Link</span>
              </>
            )}
          </Button>

          <Button
            onClick={shareRoom}
            variant="outline"
            className="h-11 text-xs border-white/10 bg-[#1a1a1a] hover:bg-[#222222] text-white rounded-xl flex items-center justify-center space-x-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Bagikan</span>
          </Button>
        </div>

        {/* Start Meeting Button */}
        <Button
          onClick={onStartMeeting}
          className="w-full h-12 text-sm font-medium bg-[#1f8cf9] hover:bg-[#1a7ad9] text-white shadow-lg shadow-[#1f8cf9]/20 transition-all rounded-xl"
          size="lg"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Mulai Meeting Sekarang
        </Button>
      </CardContent>
    </Card>
  );
}

