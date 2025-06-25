'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Camera, AlertTriangle, Activity, Brain, FileText } from 'lucide-react';
import EmotionSessionControls from '@/components/EmotionSessionControls';
import { 
  EmotionSession, 
  EmotionDataPoint, 
  emotionTranslations, 
  emotionColors, 
  emotionEmojis,
  generateSessionId,
  calculateEmotionSummary
} from '@/lib/emotion-types';
import { SimplePDFGenerator } from '@/lib/simple-pdf-generator';

interface EmotionResult {
  emotion: string;
  confidence: number;
  timestamp: Date;
}

export default function EmotionDetectionClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionResult | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  
  // Session tracking states
  const [currentSession, setCurrentSession] = useState<EmotionSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState<EmotionDataPoint[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Load Face API models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setError(null);
        console.log('🔄 Loading Face API models...');
        
        const modelUrl = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
        ]);
        
        console.log('✅ Face API models loaded successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('❌ Error loading Face API models:', err);
        setError('Gagal memuat model AI. Pastikan model sudah didownload.');
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);  // Start camera
  const startCamera = async () => {
    try {
      console.log('📷 Requesting camera access...');
      setIsCameraLoading(true);
      setError(null);
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      console.log('✅ Camera access granted');
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('✅ Video stream attached to video element');
      }
      
      setHasCamera(true);
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      let errorMessage = 'Tidak dapat mengakses kamera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Izin kamera ditolak. Silakan berikan izin kamera dan refresh halaman.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Kamera tidak ditemukan. Pastikan kamera terhubung.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Browser tidak mendukung akses kamera.';
      } else {
        errorMessage = `Error kamera: ${err.message}`;
      }
      
      setError(errorMessage);
      setHasCamera(false);
    } finally {
      setIsCameraLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Detect emotions
  const detectEmotions = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const maxExpression = Object.entries(expressions).reduce((a, b) =>
          expressions[a[0] as keyof typeof expressions] > expressions[b[0] as keyof typeof expressions] ? a : b
        );

        const emotion = maxExpression[0];
        const confidence = maxExpression[1];

        // Only update if confidence is reasonable
        if (confidence > 0.3) {
          const newEmotion: EmotionResult = {
            emotion,
            confidence,
            timestamp: new Date()
          };

          setCurrentEmotion(newEmotion);
          setEmotionHistory(prev => [newEmotion, ...prev.slice(0, 9)]); // Keep last 10

          // Record data for active session with actual elapsed time
          if (isSessionActive && currentSession) {
            const elapsedSeconds = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
            
            const dataPoint: EmotionDataPoint = {
              timestamp: elapsedSeconds,
              emotions: {
                angry: expressions.angry,
                disgusted: expressions.disgusted,
                fearful: expressions.fearful,
                happy: expressions.happy,
                neutral: expressions.neutral,
                sad: expressions.sad,
                surprised: expressions.surprised
              },
              confidence,
              dominantEmotion: emotion
            };

            // Only add if it's been at least 1 second since last data point
            setSessionData(prev => {
              const lastPoint = prev[prev.length - 1];
              if (!lastPoint || elapsedSeconds > lastPoint.timestamp) {
                console.log('📊 Adding data point:', { time: elapsedSeconds, emotion, confidence: Math.round(confidence * 100) });
                return [...prev, dataPoint];
              }
              return prev;
            });
          }
        }

        // Draw detections on canvas
        const canvas = canvasRef.current;
        const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }
    } catch (err) {
      console.error('❌ Detection error:', err);
    }
  };
  // Start detection
  const startDetection = async () => {
    try {
      console.log('🚀 Starting detection...');
      
      // Always try to start camera first
      await startCamera();
      
      setIsDetecting(true);
      detectionIntervalRef.current = setInterval(detectEmotions, 500); // Every 500ms
      
      console.log('✅ Detection started successfully');
    } catch (error) {
      console.error('❌ Failed to start detection:', error);
      setError('Gagal memulai deteksi. Periksa izin kamera.');
    }
  };

  // Stop detection
  const stopDetection = () => {
    setIsDetecting(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // Session Management Functions
  const startSession = useCallback((targetDuration: number) => {
    const session: EmotionSession = {
      id: generateSessionId(),
      startTime: new Date(),
      endTime: null,
      duration: targetDuration,
      isActive: true,
      data: []
    };

    setCurrentSession(session);
    setIsSessionActive(true);
    setSessionData([]);
    sessionStartTimeRef.current = Date.now();
    
    console.log('🎬 Session started:', session.id);
  }, []);

  const stopSession = useCallback(() => {
    if (currentSession) {
      const endTime = new Date();
      const actualDuration = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      
      // Create final session with actual data
      const updatedSession: EmotionSession = {
        ...currentSession,
        endTime,
        duration: actualDuration,
        isActive: false,
        data: [...sessionData], // Use actual collected data
        summary: calculateEmotionSummary(sessionData) // Calculate from real data
      };

      setCurrentSession(updatedSession);
      setIsSessionActive(false);
      
      console.log('🛑 Session stopped:', updatedSession.id, `${actualDuration}s`, `${sessionData.length} data points`);
      console.log('📊 Session data:', sessionData.slice(0, 3)); // Log first 3 data points for verification
    }
  }, [currentSession, sessionData]);

  const pauseSession = useCallback(() => {
    // Just pause data collection, keep session active
    console.log('⏸️ Session paused');
  }, []);

  const resumeSession = useCallback(() => {
    // Resume data collection
    console.log('▶️ Session resumed');
  }, []);

  const resetSession = useCallback(() => {
    setCurrentSession(null);
    setIsSessionActive(false);
    setSessionData([]);
    setEmotionHistory([]);
    sessionStartTimeRef.current = 0;
    console.log('🔄 Session reset');
  }, []);

  const downloadReport = useCallback(async () => {
    if (!currentSession || sessionData.length === 0) {
      console.error('No session data available for PDF generation');
      return;
    }

    try {
      console.log('📄 Generating PDF report...');
      
      // Create session object with current data
      const sessionForPDF: EmotionSession = {
        ...currentSession,
        data: sessionData,
        endTime: new Date(),
        duration: sessionData.length > 0 ? sessionData[sessionData.length - 1].timestamp : 0
      };
      
      const pdfGenerator = new SimplePDFGenerator();
      await pdfGenerator.generateEmotionReport(sessionForPDF);
      pdfGenerator.downloadPDF(sessionForPDF);
      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      setError('Gagal membuat laporan PDF. Silakan coba lagi.');
    }
  }, [currentSession, sessionData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      stopCamera();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-semibold mb-2">Memuat Model AI...</h2>
              <p className="text-muted-foreground">Sedang mempersiapkan deteksi emosi</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Deteksi Emosi Real-time</h1>
          <p className="text-muted-foreground">
            Analisis emosi wajah menggunakan kecerdasan buatan
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Video Section */}
          <Card>            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Kamera
                {hasCamera && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Aktif
                  </Badge>
                )}
                {!hasCamera && !isCameraLoading && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    Tidak Aktif
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Posisikan wajah di dalam frame untuk deteksi emosi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">              <div className="relative">
                {!hasCamera ? (
                  <div className="w-full h-64 rounded-lg border bg-muted flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {isCameraLoading ? 'Mengakses kamera...' : 'Klik "Aktifkan Kamera" untuk memulai'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full rounded-lg border bg-muted"
                      onLoadedData={() => {
                        if (canvasRef.current && videoRef.current) {
                          canvasRef.current.width = videoRef.current.videoWidth;
                          canvasRef.current.height = videoRef.current.videoHeight;
                        }
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full"
                    />
                  </>
                )}
              </div>
                <div className="flex gap-2">
                {!hasCamera ? (
                  <Button 
                    onClick={startCamera} 
                    disabled={isCameraLoading}
                    className="flex-1"
                  >
                    {isCameraLoading ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Mengakses Kamera...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Aktifkan Kamera
                      </>
                    )}
                  </Button>
                ) : !isDetecting ? (
                  <Button onClick={startDetection} className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Mulai Deteksi
                  </Button>
                ) : (
                  <Button onClick={stopDetection} variant="destructive" className="flex-1">
                    <Square className="w-4 h-4 mr-2" />
                    Berhenti
                  </Button>
                )}
                
                {hasCamera && (
                  <Button 
                    onClick={() => {
                      stopDetection();
                      stopCamera();
                      setHasCamera(false);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            
            {/* Current Emotion */}
            <Card>
              <CardHeader>
                <CardTitle>Emosi Saat Ini</CardTitle>
                <CardDescription>
                  Hasil deteksi emosi real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentEmotion ? (
                  <div className="text-center space-y-4">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-white ${emotionColors[currentEmotion.emotion]}`}>
                      <span className="text-2xl font-bold">
                        {emotionTranslations[currentEmotion.emotion]?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {emotionTranslations[currentEmotion.emotion] || currentEmotion.emotion}
                      </h3>
                      <p className="text-muted-foreground">
                        Tingkat Kepercayaan: {(currentEmotion.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {isDetecting ? 'Menunggu deteksi wajah...' : 'Mulai deteksi untuk melihat emosi'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emotion History */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Emosi</CardTitle>
                <CardDescription>
                  10 emosi terakhir yang terdeteksi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {emotionHistory.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {emotionHistory.map((emotion, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={emotionColors[emotion.emotion]}>
                            {emotionTranslations[emotion.emotion] || emotion.emotion}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {(emotion.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {emotion.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat emosi
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Session Management */}
        <Tabs defaultValue="detection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detection" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Deteksi Real-time
            </TabsTrigger>
            <TabsTrigger value="session" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Sesi Analisis
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Laporan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detection" className="mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>💡 Tips Deteksi Real-time:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Pastikan wajah terlihat jelas dan pencahayaan cukup</li>
                    <li>Hindari gerakan terlalu cepat untuk hasil yang lebih akurat</li>
                    <li>Model AI dapat mendeteksi 7 emosi dasar: senang, sedih, marah, takut, terkejut, jijik, dan netral</li>
                    <li>Deteksi berjalan secara real-time tanpa menyimpan data video</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="session" className="mt-6">
            <EmotionSessionControls
              currentSession={currentSession}
              onStartSession={startSession}
              onStopSession={stopSession}
              onPauseSession={pauseSession}
              onResumeSession={resumeSession}
              onResetSession={resetSession}
              onDownloadReport={downloadReport}
              isDetecting={isDetecting}
              currentEmotion={currentEmotion?.emotion || null}
              confidence={currentEmotion?.confidence || 0}
            />
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Laporan Analisis Emosi
                </CardTitle>
                <CardDescription>
                  Download laporan PDF dari sesi analisis emosi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSession?.summary ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{currentSession.summary.totalDataPoints}</div>
                        <div className="text-sm text-muted-foreground">Data Points</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{Math.round(currentSession.duration)}s</div>
                        <div className="text-sm text-muted-foreground">Durasi</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {emotionTranslations[currentSession.summary.dominantEmotion] || currentSession.summary.dominantEmotion}
                        </div>
                        <div className="text-sm text-muted-foreground">Emosi Dominan</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{currentSession.summary.confidenceScore}%</div>
                        <div className="text-sm text-muted-foreground">Akurasi Rata-rata</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Distribusi Emosi:</h4>
                      {Object.entries(currentSession.summary.averageEmotions)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([emotion, value]) => (
                          <div key={emotion} className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              <Badge variant="secondary" className={emotionColors[emotion]}>
                                {emotionTranslations[emotion] || emotion}
                              </Badge>
                            </span>
                            <span className="font-medium">{((value as number) * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                    </div>

                    <Button onClick={downloadReport} className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Download Laporan PDF
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Belum ada data sesi untuk dibuat laporan</p>
                    <p className="text-sm">Mulai sesi analisis terlebih dahulu di tab "Sesi Analisis"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
