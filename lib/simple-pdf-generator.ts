import jsPDF from 'jspdf';
import { EmotionSession, EmotionDataPoint, emotionTranslations, emotionEmojis } from './emotion-types';

/**
 * Simple PDF Generator untuk Laporan Analisis Emosi KolabEmpati
 * Menggunakan data langsung dari Face-API.js
 */
export class SimplePDFGenerator {
  private pdf: jsPDF;
  private margin = 20;
  private currentY = 20;
  private pageWidth = 210; // A4 width
  private pageHeight = 297; // A4 height

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
  }

  /**
   * Generate PDF dari session data Face-API
   */
  async generateEmotionReport(session: EmotionSession): Promise<void> {
    this.resetPosition();
    
    // Header
    this.addTitle();
    this.addSessionInfo(session);
    
    // Content sections
    this.addQuickSummary(session);
    this.addEmotionBreakdown(session);
    this.addTimelineData(session);
    this.addInsights(session);
    
    // Footer
    this.addFooter();
  }

  private resetPosition(): void {
    this.currentY = this.margin;
  }

  private addTitle(): void {
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(37, 99, 235);
    this.pdf.text('🎭 KolabEmpati', this.margin, this.currentY);
    
    this.currentY += 10;
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(75, 85, 99);
    this.pdf.text('Laporan Analisis Emosi', this.margin, this.currentY);
    
    this.currentY += 15;
  }

  private addSessionInfo(session: EmotionSession): void {
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(107, 114, 128);
    
    const startTime = session.startTime.toLocaleString('id-ID');
    const duration = this.formatDuration(session.duration);
    const totalDetections = session.data.length;
    
    this.pdf.text(`📅 Tanggal: ${startTime}`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`⏱️ Durasi: ${duration}`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`📊 Total Deteksi: ${totalDetections} data point`, this.margin, this.currentY);
    
    this.currentY += 15;
  }

  private addQuickSummary(session: EmotionSession): void {
    this.addSectionTitle('📋 Ringkasan Cepat');
    
    if (session.data.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(239, 68, 68);
      this.pdf.text('⚠️ Tidak ada data emosi yang terdeteksi dalam sesi ini', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    const summary = this.calculateSummary(session.data);
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(75, 85, 99);
    
    const dominantEmoji = emotionEmojis[summary.dominantEmotion];
    const dominantName = emotionTranslations[summary.dominantEmotion];
    
    this.pdf.text(`${dominantEmoji} Emosi Paling Sering: ${dominantName} (${summary.dominantPercentage}%)`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`🎯 Tingkat Kepercayaan Rata-rata: ${summary.avgConfidence}%`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`🔄 Perubahan Emosi: ${summary.emotionChanges} kali`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`📈 Stabilitas: ${summary.stability}`, this.margin, this.currentY);
    
    this.currentY += 15;
  }

  private addEmotionBreakdown(session: EmotionSession): void {
    this.addSectionTitle('📊 Detail Emosi');
    
    if (session.data.length === 0) {
      this.pdf.text('Tidak ada data untuk ditampilkan', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    const emotionStats = this.calculateEmotionStats(session.data);
    
    // Table header
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(75, 85, 99);
    this.pdf.text('Emosi', this.margin, this.currentY);
    this.pdf.text('Rata-rata', this.margin + 40, this.currentY);
    this.pdf.text('Maksimal', this.margin + 70, this.currentY);
    this.pdf.text('Frekuensi', this.margin + 100, this.currentY);
    this.pdf.text('Status', this.margin + 130, this.currentY);
    
    this.currentY += 8;
    
    // Draw line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY - 2, this.margin + 160, this.currentY - 2);
    
    // Data rows
    this.pdf.setFont('helvetica', 'normal');
    Object.entries(emotionStats).forEach(([emotion, stats]) => {
      const emoji = emotionEmojis[emotion];
      const name = emotionTranslations[emotion];
      const status = stats.average > 0.3 ? 'Tinggi' : stats.average > 0.1 ? 'Sedang' : 'Rendah';
      
      this.pdf.text(`${emoji} ${name}`, this.margin, this.currentY);
      this.pdf.text(`${Math.round(stats.average * 100)}%`, this.margin + 40, this.currentY);
      this.pdf.text(`${Math.round(stats.max * 100)}%`, this.margin + 70, this.currentY);
      this.pdf.text(`${stats.count}x`, this.margin + 100, this.currentY);
      this.pdf.text(status, this.margin + 130, this.currentY);
      
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  private addTimelineData(session: EmotionSession): void {
    this.addSectionTitle('⏰ Timeline Emosi');
    
    if (session.data.length === 0) {
      this.pdf.text('Tidak ada timeline untuk ditampilkan', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    const timeline = this.createTimeline(session.data);
    
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(75, 85, 99);
    
    timeline.forEach(entry => {
      const emoji = emotionEmojis[entry.emotion];
      const name = emotionTranslations[entry.emotion];
      this.pdf.text(`${entry.timeRange}: ${emoji} ${name} (${entry.confidence}%)`, this.margin, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 10;
  }

  private addInsights(session: EmotionSession): void {
    this.addSectionTitle('💡 Insight & Rekomendasi');
    
    const insights = this.generateInsights(session);
    
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(75, 85, 99);
    
    insights.forEach(insight => {
      this.pdf.text(`• ${insight}`, this.margin, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 10;
  }

  private addSectionTitle(title: string): void {
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(37, 99, 235);
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 10;
  }

  private addFooter(): void {
    const pageCount = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Footer line
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.line(this.margin, this.pageHeight - 25, this.pageWidth - this.margin, this.pageHeight - 25);
      
      // Footer text
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(120, 120, 120);
      this.pdf.text('Generated by KolabEmpati', this.margin, this.pageHeight - 15);
      this.pdf.text(`${new Date().toLocaleDateString('id-ID')}`, this.margin, this.pageHeight - 8);
      
      // Page number
      this.pdf.text(`Hal ${i}/${pageCount}`, this.pageWidth - this.margin - 20, this.pageHeight - 15);
    }
  }

  // Utility methods untuk analisis data Face-API
  private calculateSummary(data: EmotionDataPoint[]) {
    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;
    let emotionChanges = 0;
    let lastEmotion = '';

    data.forEach(point => {
      emotionCounts[point.dominantEmotion] = (emotionCounts[point.dominantEmotion] || 0) + 1;
      totalConfidence += point.confidence;
      
      if (lastEmotion && lastEmotion !== point.dominantEmotion) {
        emotionChanges++;
      }
      lastEmotion = point.dominantEmotion;
    });

    const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => 
      emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
    )[0];

    const dominantCount = emotionCounts[dominantEmotion];
    const dominantPercentage = Math.round((dominantCount / data.length) * 100);
    const avgConfidence = Math.round((totalConfidence / data.length) * 100);
    
    // Calculate stability
    const changeRate = emotionChanges / data.length;
    const stability = changeRate < 0.1 ? 'Sangat Stabil' : 
                     changeRate < 0.3 ? 'Stabil' : 
                     changeRate < 0.5 ? 'Cukup Dinamis' : 'Sangat Dinamis';

    return {
      dominantEmotion,
      dominantPercentage,
      avgConfidence,
      emotionChanges,
      stability
    };
  }

  private calculateEmotionStats(data: EmotionDataPoint[]) {
    const emotions = ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised'];
    const stats: Record<string, { average: number; max: number; count: number }> = {};

    emotions.forEach(emotion => {
      const values = data.map(point => point.emotions[emotion as keyof typeof point.emotions]);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const count = data.filter(point => point.dominantEmotion === emotion).length;
      
      stats[emotion] = { average, max, count };
    });

    return stats;
  }

  private createTimeline(data: EmotionDataPoint[]) {
    const timeline: Array<{ timeRange: string; emotion: string; confidence: number }> = [];
    const chunks = Math.min(5, Math.ceil(data.length / 3)); // Max 5 periods
    
    for (let i = 0; i < chunks; i++) {
      const startIdx = Math.floor((data.length / chunks) * i);
      const endIdx = Math.floor((data.length / chunks) * (i + 1));
      const chunkData = data.slice(startIdx, endIdx);
      
      if (chunkData.length === 0) continue;
      
      const startTime = Math.round(chunkData[0].timestamp);
      const endTime = Math.round(chunkData[chunkData.length - 1].timestamp);
      
      // Find dominant emotion in this period
      const emotionCounts: Record<string, number> = {};
      let totalConfidence = 0;
      
      chunkData.forEach(point => {
        emotionCounts[point.dominantEmotion] = (emotionCounts[point.dominantEmotion] || 0) + 1;
        totalConfidence += point.confidence;
      });
      
      const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => 
        emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
      )[0];
      
      const avgConfidence = Math.round((totalConfidence / chunkData.length) * 100);
      
      timeline.push({
        timeRange: `${startTime}-${endTime}s`,
        emotion: dominantEmotion,
        confidence: avgConfidence
      });
    }
    
    return timeline;
  }

  private generateInsights(session: EmotionSession): string[] {
    const insights: string[] = [];
    
    if (session.data.length === 0) {
      insights.push('Tidak cukup data untuk memberikan insight');
      return insights;
    }

    const summary = this.calculateSummary(session.data);
    
    // Duration insights
    if (session.duration < 30) {
      insights.push('Sesi terlalu singkat. Disarankan minimal 30 detik untuk hasil yang lebih akurat');
    }
    
    // Confidence insights
    if (summary.avgConfidence < 60) {
      insights.push('Tingkat kepercayaan rendah. Periksa pencahayaan dan posisi wajah');
    } else if (summary.avgConfidence > 80) {
      insights.push('Tingkat kepercayaan tinggi. Kondisi deteksi optimal');
    }
    
    // Emotion insights
    if (summary.dominantEmotion === 'happy') {
      insights.push('Mood positif mendominasi sesi ini');
    } else if (summary.dominantEmotion === 'neutral') {
      insights.push('Emosi cenderung stabil dan netral');
    } else if (['sad', 'angry', 'fearful'].includes(summary.dominantEmotion)) {
      insights.push('Terdeteksi emosi negatif yang dominan. Pertimbangkan aktivitas relaksasi');
    }
    
    // Stability insights
    if (summary.stability === 'Sangat Stabil') {
      insights.push('Emosi sangat konsisten sepanjang sesi');
    } else if (summary.stability === 'Sangat Dinamis') {
      insights.push('Emosi berubah-ubah. Mungkin ada faktor eksternal yang mempengaruhi');
    }
    
    // General recommendations
    insights.push('Lakukan sesi rutin untuk memantau pola emosi harian');
    
    return insights;
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  /**
   * Download PDF file
   */
  public downloadPDF(session: EmotionSession, filename?: string): void {
    const defaultName = `emotion-report-${new Date().toISOString().split('T')[0]}.pdf`;
    this.pdf.save(filename || defaultName);
  }

  /**
   * Get PDF as blob for upload/sharing
   */
  public getPDFBlob(): Blob {
    return this.pdf.output('blob');
  }
}
