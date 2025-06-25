'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, Camera, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import { 
  emotionTranslations, 
  emotionColors, 
  emotionEmojis
} from '@/lib/emotion-types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
  const [emotionStats, setEmotionStats] = useState<Record<string, number>>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          
          // Update emotion statistics
          setEmotionStats(prev => ({
            ...prev,
            [emotion]: (prev[emotion] || 0) + 1
          }));
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      stopCamera();
    };
  }, []);

  // Reset statistics
  const resetStats = () => {
    setEmotionStats({});
    setEmotionHistory([]);
    setCurrentEmotion(null);
  };

  // Prepare chart data
  const prepareBarChartData = () => {
    const emotions = Object.keys(emotionTranslations);
    const data = emotions.map(emotion => emotionStats[emotion] || 0);
    const labels = emotions.map(emotion => emotionTranslations[emotion]);
    const backgroundColors = emotions.map(emotion => emotionColors[emotion]);

    return {
      labels,
      datasets: [
        {
          label: 'Jumlah Deteksi',
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          hoverBackgroundColor: backgroundColors.map(color => color + 'CC'),
          hoverBorderWidth: 2,
        },
      ],
    };
  };

  const prepareDoughnutChartData = () => {
    const emotions = Object.keys(emotionStats);
    if (emotions.length === 0) return { labels: [], datasets: [] };
    
    const data = emotions.map(emotion => emotionStats[emotion]);
    const total = data.reduce((sum, value) => sum + value, 0);
    const labels = emotions.map(emotion => {
      const percentage = ((emotionStats[emotion] / total) * 100).toFixed(1);
      return `${emotionTranslations[emotion]} (${percentage}%)`;
    });
    const backgroundColors = emotions.map(emotion => emotionColors[emotion]);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBackgroundColor: backgroundColors.map(color => color + 'CC'),
          hoverBorderWidth: 3,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const total = Object.values(emotionStats).reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed.y / total) * 100).toFixed(1) : '0';
            return `${context.dataset.label}: ${context.parsed.y} (${percentage}%)`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: 'rgba(0, 0, 0, 0.6)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
    },
  };

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
                      <span className="text-3xl">
                        {emotionEmojis[currentEmotion.emotion] || '😐'}
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
                          <span className="text-lg">{emotionEmojis[emotion.emotion] || '😐'}</span>
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

            {/* Visualization Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Visualisasi Emosi
                </CardTitle>
                <CardDescription>
                  Grafik analisis emosi yang terdeteksi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(emotionStats).length > 0 ? (
                  <div className="space-y-6">
                    
                    {/* Charts Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      
                      {/* Bar Chart */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-center">Jumlah Deteksi per Emosi</h4>
                        <div className="h-64 w-full p-2 bg-muted/30 rounded-lg">
                          <Bar 
                            options={chartOptions} 
                            data={prepareBarChartData()} 
                          />
                        </div>
                      </div>

                      {/* Doughnut Chart */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-center">Distribusi Emosi (%)</h4>
                        <div className="h-64 w-full p-2 bg-muted/30 rounded-lg flex items-center justify-center">
                          <div className="w-full max-w-[200px]">
                            <Doughnut 
                              options={doughnutOptions} 
                              data={prepareDoughnutChartData()} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistics Summary */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <p className="text-2xl font-bold text-blue-600">
                            {Object.values(emotionStats).reduce((a, b) => a + b, 0)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">Total Deteksi</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <BarChart3 className="w-4 h-4 text-purple-600" />
                          <p className="text-2xl font-bold text-purple-600">
                            {Object.keys(emotionStats).length}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">Jenis Emosi</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button 
                        onClick={resetStats} 
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Activity className="w-4 h-4" />
                        Reset Statistik
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Belum Ada Data Visualisasi</h3>
                    <p className="text-sm">Mulai deteksi emosi untuk melihat grafik dan statistik</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Tips Deteksi Real-time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>💡 Tips untuk Hasil Terbaik:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Pastikan wajah terlihat jelas dan pencahayaan cukup</li>
                <li>Hindari gerakan terlalu cepat untuk hasil yang lebih akurat</li>
                <li>Model AI dapat mendeteksi 7 emosi dasar: senang, sedih, marah, takut, terkejut, jijik, dan netral</li>
                <li>Deteksi berjalan secara real-time tanpa menyimpan data video</li>
              </ul>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
