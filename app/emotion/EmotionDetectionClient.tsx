'use client';

import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, Camera, AlertTriangle, Activity, BarChart3, RotateCcw, ArrowLeft } from 'lucide-react';
import { 
  emotionTranslations, 
  emotionColors, 
  emotionEmojis
} from '@/lib/emotion-types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Link from 'next/link';

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
        setError('Gagal memuat model AI. Pastikan model sudah tersedia di /models.');
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      console.log('📷 Requesting camera access...');
      setIsCameraLoading(true);
      setError(null);
      
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
      }
      
      setHasCamera(true);
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      let errorMessage = 'Tidak dapat mengakses kamera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Izin kamera ditolak. Silakan berikan izin kamera pada browser.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Kamera tidak ditemukan. Pastikan perangkat kamera terhubung.';
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

        if (confidence > 0.3) {
          const newEmotion: EmotionResult = {
            emotion,
            confidence,
            timestamp: new Date()
          };

          setCurrentEmotion(newEmotion);
          setEmotionHistory(prev => [newEmotion, ...prev.slice(0, 9)]);
          
          setEmotionStats(prev => ({
            ...prev,
            [emotion]: (prev[emotion] || 0) + 1
          }));
        }

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
      await startCamera();
      
      setIsDetecting(true);
      detectionIntervalRef.current = setInterval(detectEmotions, 500);
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
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: backgroundColors.map(color => color + 'E6'),
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
          borderColor: '#161616',
          borderWidth: 2,
          hoverBackgroundColor: backgroundColors.map(color => color + 'E6'),
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
        backgroundColor: '#161616',
        titleColor: '#ffffff',
        bodyColor: '#9ca3af',
        borderColor: 'rgba(255, 255, 255, 0.15)',
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
          color: 'rgba(255, 255, 255, 0.6)',
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: { size: 11 }
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
          padding: 16,
          usePointStyle: true,
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11,
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
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center p-4" data-lk-theme="default">
        <Card className="bg-[#161616] border border-white/10 max-w-md w-full text-center p-8 rounded-2xl shadow-2xl">
          <CardContent className="p-0 space-y-4">
            <Activity className="w-10 h-10 mx-auto text-[#1f8cf9] animate-spin" />
            <h2 className="text-lg font-semibold text-white">Memuat Model Face-API...</h2>
            <p className="text-xs text-neutral-400">Menyiapkan neural network pendeteksi emosi di browser</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white py-10 px-4 sm:px-6" data-lk-theme="default">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link 
                href="/"
                className="inline-flex items-center text-xs text-neutral-400 hover:text-white transition-colors mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Kembali ke Beranda
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Deteksi Emosi Wajah Real-time
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Analisis ekspresi emosi langsung di sisi klien menggunakan Face-API.js
            </p>
          </div>

          <Badge variant="outline" className="self-start sm:self-auto text-xs bg-white/5 border-white/15 text-neutral-300">
            Standalone AI Module
          </Badge>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400 rounded-xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6 items-start">
          
          {/* Video Camera Section */}
          <Card className="bg-[#161616] border border-white/10 text-white rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="pb-3 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#1f8cf9]" />
                  Viewport Kamera
                </CardTitle>
                {hasCamera && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px]">
                    Kamera Aktif
                  </Badge>
                )}
                {!hasCamera && !isCameraLoading && (
                  <Badge variant="outline" className="bg-neutral-800 text-neutral-400 border-white/10 text-[11px]">
                    Siap
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-neutral-400">
                Posisikan wajah Anda tegak lurus di dalam bingkai
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-5 pt-0">
              <div className="relative aspect-video rounded-xl border border-white/10 bg-[#0c0c0c] overflow-hidden flex items-center justify-center">
                {!hasCamera ? (
                  <div className="text-center p-6 space-y-2">
                    <Camera className="w-10 h-10 mx-auto text-neutral-600" />
                    <p className="text-xs text-neutral-400">
                      {isCameraLoading ? 'Menghubungkan kamera...' : 'Klik "Mulai Deteksi" untuk mengaktifkan video'}
                    </p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      onLoadedData={() => {
                        if (canvasRef.current && videoRef.current) {
                          canvasRef.current.width = videoRef.current.videoWidth;
                          canvasRef.current.height = videoRef.current.videoHeight;
                        }
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {!hasCamera ? (
                  <Button 
                    onClick={startCamera} 
                    disabled={isCameraLoading}
                    className="flex-1 h-11 bg-[#1f8cf9] hover:bg-[#1a7ad9] text-white text-xs font-medium rounded-xl shadow-lg shadow-[#1f8cf9]/20"
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
                  <Button 
                    onClick={startDetection} 
                    className="flex-1 h-11 bg-[#1f8cf9] hover:bg-[#1a7ad9] text-white text-xs font-medium rounded-xl shadow-lg shadow-[#1f8cf9]/20"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Mulai Deteksi
                  </Button>
                ) : (
                  <Button 
                    onClick={stopDetection} 
                    variant="destructive" 
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-xl"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Hentikan Deteksi
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
                    className="h-11 border-white/10 bg-[#1a1a1a] hover:bg-[#222222] text-white text-xs rounded-xl px-4"
                  >
                    Tutup
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results & History Section */}
          <div className="space-y-6">
            
            {/* Current Emotion Card */}
            <Card className="bg-[#161616] border border-white/10 text-white rounded-2xl shadow-xl">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-base font-semibold">Status Emosi Terkini</CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  Hasil inferensi klasifikasi ekspresi wajah
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                {currentEmotion ? (
                  <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#121212] border border-white/10">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10 shrink-0"
                      style={{ backgroundColor: `${emotionColors[currentEmotion.emotion]}20` }}
                    >
                      <span>{emotionEmojis[currentEmotion.emotion] || '😐'}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                          {emotionTranslations[currentEmotion.emotion] || currentEmotion.emotion}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className="text-[11px] border-white/15"
                          style={{ color: emotionColors[currentEmotion.emotion] }}
                        >
                          {(currentEmotion.confidence * 100).toFixed(0)}% Akurasi
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-400">
                        Terdeteksi pada {currentEmotion.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500 text-xs bg-[#121212] rounded-xl border border-white/10">
                    {isDetecting ? 'Menganalisis ekspresi wajah...' : 'Deteksi belum aktif'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History Card */}
            <Card className="bg-[#161616] border border-white/10 text-white rounded-2xl shadow-xl">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-base font-semibold">Log Riwayat Terakhir</CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  10 rekaman emosi terbaru
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                {emotionHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {emotionHistory.map((emotion, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-[#121212] border border-white/10 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{emotionEmojis[emotion.emotion] || '😐'}</span>
                          <span className="font-medium text-white">
                            {emotionTranslations[emotion.emotion] || emotion.emotion}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            ({(emotion.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {emotion.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-500 text-xs bg-[#121212] rounded-xl border border-white/10">
                    Belum ada rekaman riwayat
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Analytics & Visualization Section */}
        <Card className="bg-[#161616] border border-white/10 text-white rounded-2xl shadow-xl">
          <CardHeader className="pb-2 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1f8cf9]" />
                Distribusi & Statistik Emosi
              </CardTitle>
              {Object.keys(emotionStats).length > 0 && (
                <Button 
                  onClick={resetStats} 
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-white/10 bg-[#1a1a1a] hover:bg-[#222222] text-white rounded-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>
            <CardDescription className="text-xs text-neutral-400">
              Visualisasi komparatif akumulasi emosi yang terdeteksi selama sesi
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-3">
            {Object.keys(emotionStats).length > 0 ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Bar Chart */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-neutral-400 text-center">Jumlah Deteksi per Kategori</h4>
                    <div className="h-60 w-full p-3 bg-[#111111] rounded-xl border border-white/10">
                      <Bar options={chartOptions} data={prepareBarChartData()} />
                    </div>
                  </div>

                  {/* Doughnut Chart */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-neutral-400 text-center">Proporsi Emosi (%)</h4>
                    <div className="h-60 w-full p-3 bg-[#111111] rounded-xl border border-white/10 flex items-center justify-center">
                      <div className="w-full max-w-[220px]">
                        <Doughnut options={doughnutOptions} data={prepareDoughnutChartData()} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-[#111111] rounded-xl border border-white/10 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white font-mono">
                      {Object.values(emotionStats).reduce((a, b) => a + b, 0)}
                    </p>
                    <p className="text-xs text-neutral-400">Total Deteksi</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1f8cf9] font-mono">
                      {Object.keys(emotionStats).length} / 7
                    </p>
                    <p className="text-xs text-neutral-400">Variasi Emosi</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-neutral-500 text-xs bg-[#121212] rounded-xl border border-white/10">
                Mulai deteksi kamera untuk melihat grafik visualisasi analitik emosi
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

