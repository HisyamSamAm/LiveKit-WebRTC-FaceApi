import { Metadata } from 'next';
import EmotionDetectionClient from './EmotionDetectionClient';

export const metadata: Metadata = {
  title: 'Deteksi Emosi - KolabEmpati',
  description: 'Deteksi emosi real-time menggunakan Face API.js',
};

export default function EmotionPage() {
  return <EmotionDetectionClient />;
}
