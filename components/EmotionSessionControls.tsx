'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Square, 
  Pause, 
  RotateCcw, 
  Download, 
  Clock, 
  Activity,
  BarChart3,
  Settings
} from 'lucide-react';
import { EmotionSession, EmotionDataPoint, generateSessionId, formatDuration } from '@/lib/emotion-types';

interface EmotionSessionControlsProps {
  currentSession: EmotionSession | null;
  onStartSession: (targetDuration: number) => void;
  onStopSession: () => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onResetSession: () => void;
  onDownloadReport: () => void;
  isDetecting: boolean;
  currentEmotion: string | null;
  confidence: number;
}

export default function EmotionSessionControls({
  currentSession,
  onStartSession,
  onStopSession,
  onPauseSession,
  onResumeSession,
  onResetSession,
  onDownloadReport,
  isDetecting,
  currentEmotion,
  confidence
}: EmotionSessionControlsProps) {
  const [targetDuration, setTargetDuration] = useState(60); // seconds
  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (currentSession?.isActive && !isPaused) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession?.isActive, isPaused]);

  // Separate effect to handle auto-stop when target duration reached
  useEffect(() => {
    if (currentSession?.isActive && currentTime >= targetDuration && currentTime > 0) {
      onStopSession();
    }
  }, [currentTime, targetDuration, currentSession?.isActive, onStopSession]);

  // Reset timer when session changes
  useEffect(() => {
    if (!currentSession?.isActive) {
      setCurrentTime(0);
      setIsPaused(false);
    }
  }, [currentSession?.isActive]);

  const handleStart = () => {
    setCurrentTime(0);
    setIsPaused(false);
    onStartSession(targetDuration);
  };

  const handlePause = () => {
    setIsPaused(true);
    onPauseSession();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResumeSession();
  };

  const handleStop = () => {
    setIsPaused(false);
    onStopSession();
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPaused(false);
    onResetSession();
  };

  const progress = targetDuration > 0 ? (currentTime / targetDuration) * 100 : 0;
  const remainingTime = Math.max(0, targetDuration - currentTime);

  const getProgressColor = () => {
    if (progress < 50) return 'bg-blue-500';
    if (progress < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSessionStatus = () => {
    if (!currentSession) return { text: 'Belum Dimulai', color: 'bg-gray-500' };
    if (currentSession.isActive && !isPaused) return { text: 'Recording', color: 'bg-red-500 animate-pulse' };
    if (currentSession.isActive && isPaused) return { text: 'Paused', color: 'bg-yellow-500' };
    return { text: 'Selesai', color: 'bg-green-500' };
  };

  const status = getSessionStatus();

  return (
    <div className="space-y-6">
      {/* Session Configuration */}
      {!currentSession?.isActive && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="h-5 w-5 mr-2" />
              Konfigurasi Sesi
            </CardTitle>
            <CardDescription>
              Atur durasi tracking emosi sesuai kebutuhan Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Durasi Target (detik)</Label>
              <div className="flex space-x-2">
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="600"
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(Math.max(5, parseInt(e.target.value) || 60))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTargetDuration(30)}
                >
                  30s
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTargetDuration(60)}
                >
                  1m
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTargetDuration(120)}
                >
                  2m
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Rekomendasi: 30-60 detik untuk analisis standar, 2+ menit untuk analisis mendalam
              </p>
            </div>

            <Button
              onClick={handleStart}
              disabled={!isDetecting}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Play className="h-5 w-5 mr-2" />
              Mulai Tracking ({formatDuration(targetDuration)})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Session Controls */}
      {currentSession && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Activity className="h-5 w-5 mr-2" />
                Session: {currentSession.id}
              </CardTitle>
              <Badge className={`${status.color} text-white`}>
                {status.text}
              </Badge>
            </div>
            <CardDescription>
              {currentSession.isActive ? 'Sedang merekam data emosi...' : 'Sesi telah selesai'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timer & Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Waktu</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold">
                    {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                    {(currentTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sisa: {Math.floor(remainingTime / 60).toString().padStart(2, '0')}:
                    {(remainingTime % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Progress 
                  value={progress} 
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0s</span>
                  <span>{Math.round(progress)}%</span>
                  <span>{targetDuration}s</span>
                </div>
              </div>
            </div>

            {/* Current Emotion */}
            {currentEmotion && currentSession.isActive && (
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Emosi Saat Ini</p>
                    <p className="text-lg font-bold text-primary">{currentEmotion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-lg font-bold">{Math.round(confidence * 100)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Data Points</p>
                <p className="text-lg font-bold">{currentSession.data.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-lg font-bold">{formatDuration(targetDuration)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Elapsed</p>
                <p className="text-lg font-bold">{formatDuration(currentTime)}</p>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex space-x-2">
              {currentSession.isActive ? (
                <>
                  {!isPaused ? (
                    <Button
                      onClick={handlePause}
                      variant="outline"
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={handleResume}
                      variant="outline"
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={onDownloadReport}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Card */}
      {currentSession && currentSession.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Emosi Terdeteksi</p>
                <p className="font-semibold">{new Set(currentSession.data.map(d => d.dominantEmotion)).size} jenis</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Confidence</p>
                <p className="font-semibold">
                  {Math.round((currentSession.data.reduce((sum, d) => sum + d.confidence, 0) / currentSession.data.length) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Perubahan Emosi</p>
                <p className="font-semibold">
                  {currentSession.data.length > 1 ? 
                    currentSession.data.filter((d, i) => i > 0 && d.dominantEmotion !== currentSession.data[i-1].dominantEmotion).length 
                    : 0} kali
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Sampling Rate</p>
                <p className="font-semibold">
                  {currentSession.data.length > 0 && currentTime > 0 ? 
                    Math.round(currentSession.data.length / currentTime * 10) / 10 : 0} Hz
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
