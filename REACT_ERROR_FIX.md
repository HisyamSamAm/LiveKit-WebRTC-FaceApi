# 🔧 Fix untuk React Error: "Cannot update component while rendering"

## ❌ Problem yang Terjadi

### Error Message:
```
Cannot update a component (`EmotionDetectionClient`) while rendering a different component (`EmotionSessionControls`). 
To locate the bad setState() call inside `EmotionSessionControls`, follow the stack trace as described in https://react.dev/link/setstate-in-render
```

### Root Cause:
Error ini terjadi karena ada `setState` (dalam hal ini `onStopSession()`) yang dipanggil di dalam fungsi `setCurrentTime()` di komponen `EmotionSessionControls`. Hal ini menyebabkan React melakukan update state saat sedang dalam proses rendering.

## ✅ Solusi yang Diterapkan

### 1. **Pemisahan useEffect untuk Auto-Stop Timer**

**Before (Bermasalah):**
```typescript
useEffect(() => {
  let interval: NodeJS.Timeout | null = null;

  if (currentSession?.isActive && !isPaused) {
    interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1;
        
        // ❌ Masalah: setState dipanggil di dalam setter
        if (newTime >= targetDuration && currentSession.isActive) {
          onStopSession(); // Ini menyebabkan error!
          return newTime;
        }
        
        return newTime;
      });
    }, 1000);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [currentSession?.isActive, isPaused, targetDuration, onStopSession]);
```

**After (Fixed):**
```typescript
// Timer effect - hanya update currentTime
useEffect(() => {
  let interval: NodeJS.Timeout | null = null;

  if (currentSession?.isActive && !isPaused) {
    interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1;
        return newTime; // ✅ Hanya return nilai baru
      });
    }, 1000);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [currentSession?.isActive, isPaused]);

// ✅ Separate effect untuk handle auto-stop
useEffect(() => {
  if (currentSession?.isActive && currentTime >= targetDuration && currentTime > 0) {
    onStopSession();
  }
}, [currentTime, targetDuration, currentSession?.isActive, onStopSession]);
```

### 2. **useCallback untuk Session Management Functions**

**Added to EmotionDetectionClient.tsx:**
```typescript
import { useState, useRef, useEffect, useCallback } from 'react';

// ✅ Wrap semua session functions dengan useCallback
const startSession = useCallback((targetDuration: number) => {
  // ... existing code
}, []);

const stopSession = useCallback(() => {
  // ... existing code  
}, [currentSession, sessionData]);

const pauseSession = useCallback(() => {
  // ... existing code
}, []);

const resumeSession = useCallback(() => {
  // ... existing code
}, []);

const resetSession = useCallback(() => {
  // ... existing code
}, []);

const downloadReport = useCallback(async () => {
  // ... existing code
}, [currentSession]);
```

## 🔍 Penjelasan Teknis

### Mengapa Error Terjadi?
1. **Rendering Cycle**: Saat React merender komponen, semua operasi harus bersifat "pure"
2. **setState in Render**: Memanggil setState di dalam proses render menyebabkan side effect
3. **Infinite Loop Risk**: Bisa menyebabkan infinite re-rendering

### Mengapa Solusi Ini Bekerja?
1. **Separation of Concerns**: Timer update dan auto-stop dipisah ke useEffect yang berbeda
2. **useCallback**: Mencegah unnecessary re-renders karena function reference yang stabil
3. **Dependency Array**: Memastikan effect hanya berjalan ketika dependency berubah

## 🎯 Benefits dari Fix Ini

### Performance
- ✅ Tidak ada re-render yang tidak perlu
- ✅ Timer berjalan lebih stabil
- ✅ Memory leak prevention dengan proper cleanup

### Stability  
- ✅ Tidak ada React warning/error
- ✅ Predictable component behavior
- ✅ Better debugging experience

### Maintainability
- ✅ Cleaner code structure
- ✅ Easier to understand flow
- ✅ Better separation of concerns

## 🔄 Flow Setelah Fix

### Normal Timer Flow:
1. Timer useEffect starts → setInterval runs
2. Every second → setCurrentTime(prev => prev + 1)
3. currentTime changes → trigger auto-stop useEffect
4. If target reached → onStopSession() called
5. Session stops → timer cleanup

### Session Management Flow:
1. User clicks start → onStartSession (useCallback)
2. EmotionDetectionClient → startSession (useCallback)
3. Session active → Timer starts
4. Target reached → stopSession (useCallback)
5. Session ends → Timer stops

## 📋 Checklist Verifikasi

- ✅ Timer berjalan tanpa error
- ✅ Auto-stop bekerja pada target duration
- ✅ Manual stop/pause/resume berfungsi
- ✅ Session data tetap akurat
- ✅ PDF generation tidak terpengaruh
- ✅ No React warnings in console

---

**Result**: Error React fixed, timer lebih stabil, dan performance meningkat! 🎉
