// Emotion data types and utilities
export interface EmotionDataPoint {
  timestamp: number; // seconds from start
  emotions: {
    angry: number;
    disgusted: number;
    fearful: number;
    happy: number;
    neutral: number;
    sad: number;
    surprised: number;
  };
  confidence: number;
  dominantEmotion: string;
}

export interface EmotionSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // seconds
  isActive: boolean;
  data: EmotionDataPoint[];
  summary?: EmotionSummary;
}

export interface EmotionSummary {
  dominantEmotion: string;
  dominantPercentage: number;
  averageEmotions: Record<string, number>;
  emotionChanges: number;
  stabilityScore: number;
  confidenceScore: number;
  totalDataPoints: number;
  peakMoments: Array<{
    timestamp: number;
    emotion: string;
    confidence: number;
  }>;
}

export const emotionTranslations: Record<string, string> = {
  angry: 'Marah',
  disgusted: 'Jijik', 
  fearful: 'Takut',
  happy: 'Senang',
  neutral: 'Netral',
  sad: 'Sedih',
  surprised: 'Terkejut'
};

export const emotionColors: Record<string, string> = {
  angry: '#EF4444',
  disgusted: '#84CC16',
  fearful: '#8B5CF6', 
  happy: '#22C55E',
  neutral: '#6B7280',
  sad: '#3B82F6',
  surprised: '#F59E0B'
};

export const emotionEmojis: Record<string, string> = {
  angry: '😠',
  disgusted: '🤢',
  fearful: '😨', 
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  surprised: '😲'
};

// Utility functions
export function calculateEmotionSummary(data: EmotionDataPoint[]): EmotionSummary {
  if (data.length === 0) {
    return {
      dominantEmotion: 'neutral',
      dominantPercentage: 0,
      averageEmotions: {},
      emotionChanges: 0,
      stabilityScore: 0,
      confidenceScore: 0,
      totalDataPoints: 0,
      peakMoments: []
    };
  }

  // Calculate average emotions
  const emotionSums = {
    angry: 0, disgusted: 0, fearful: 0, happy: 0,
    neutral: 0, sad: 0, surprised: 0
  };

  let totalConfidence = 0;
  let emotionChanges = 0;
  let previousDominant = '';

  const peakMoments: Array<{ timestamp: number; emotion: string; confidence: number }> = [];

  data.forEach((point, index) => {
    // Sum emotions
    Object.keys(emotionSums).forEach(emotion => {
      emotionSums[emotion as keyof typeof emotionSums] += point.emotions[emotion as keyof typeof point.emotions];
    });

    totalConfidence += point.confidence;

    // Track emotion changes
    if (index > 0 && point.dominantEmotion !== previousDominant) {
      emotionChanges++;
    }
    previousDominant = point.dominantEmotion;

    // Find peak moments (high confidence + strong emotion)
    if (point.confidence > 0.8 && point.emotions[point.dominantEmotion as keyof typeof point.emotions] > 0.7) {
      peakMoments.push({
        timestamp: point.timestamp,
        emotion: point.dominantEmotion,
        confidence: point.confidence
      });
    }
  });

  // Calculate averages
  const averageEmotions: Record<string, number> = {};
  Object.keys(emotionSums).forEach(emotion => {
    averageEmotions[emotion] = emotionSums[emotion as keyof typeof emotionSums] / data.length;
  });

  // Find dominant emotion
  const dominantEmotion = Object.keys(averageEmotions).reduce((a, b) => 
    averageEmotions[a] > averageEmotions[b] ? a : b
  );

  const dominantPercentage = Math.round(averageEmotions[dominantEmotion] * 100);

  // Calculate stability score (lower changes = higher stability)
  const maxPossibleChanges = data.length - 1;
  const stabilityScore = maxPossibleChanges > 0 ? 
    Math.max(0, 5 - (emotionChanges / maxPossibleChanges) * 5) : 5;

  // Calculate confidence score
  const confidenceScore = totalConfidence / data.length;

  return {
    dominantEmotion,
    dominantPercentage,
    averageEmotions,
    emotionChanges,
    stabilityScore: Math.round(stabilityScore * 10) / 10,
    confidenceScore: Math.round(confidenceScore * 100),
    totalDataPoints: data.length,
    peakMoments: peakMoments.slice(0, 5) // Top 5 peak moments
  };
}

export function generateSessionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `EA${dateStr}-${timeStr}-${randomStr}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} detik`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} menit ${remainingSeconds} detik`;
}

export function getDurationCategory(seconds: number): string {
  if (seconds <= 15) return 'Quick Check';
  if (seconds <= 60) return 'Standard';
  if (seconds <= 300) return 'Comprehensive'; 
  return 'Research';
}

export function getReliabilityLevel(confidenceScore: number): {
  level: string;
  color: string;
  description: string;
} {
  if (confidenceScore >= 90) {
    return {
      level: 'Excellent',
      color: '#22C55E',
      description: 'Very reliable results'
    };
  } else if (confidenceScore >= 70) {
    return {
      level: 'Good', 
      color: '#F59E0B',
      description: 'Generally reliable'
    };
  } else if (confidenceScore >= 50) {
    return {
      level: 'Fair',
      color: '#EF4444', 
      description: 'Use with caution'
    };
  } else {
    return {
      level: 'Poor',
      color: '#6B7280',
      description: 'Insufficient data'
    };
  }
}
