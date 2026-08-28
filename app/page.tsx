"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type React from "react"
import { Suspense, useState } from "react"
import { encodePassphrase, randomString, generateRoomWithCode } from "@/lib/client-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Video, Shield, Users, Zap, Globe, Lock, Play, Sparkles, Heart, CheckCircle2, Brain, Hash, UserPlus, ArrowUpRight } from "lucide-react"
import { JoinByCode } from "@/components/JoinByCode"
import { RoomCodeDisplay } from "@/components/RoomCodeDisplay"

function TabsComponent(props: React.PropsWithChildren<{}>) {
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get("tab") === "join" ? "join" : "demo"

  const router = useRouter()
  function onTabChange(value: string) {
    router.push(`/?tab=${value}`)
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      <ShadcnTabs value={currentTab} onValueChange={onTabChange} className="w-full">
        {/* LiveKit-style Segmented Tabs */}
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-[#181818] border border-white/10 p-1 rounded-xl">
          <TabsTrigger 
            value="demo" 
            className="text-sm font-medium rounded-lg text-white/70 data-[state=active]:bg-[#282828] data-[state=active]:text-white transition-all"
          >
            <Play className="h-4 w-4 mr-2 text-[#1f8cf9]" />
            Buat Meeting
          </TabsTrigger>
          <TabsTrigger 
            value="join" 
            className="text-sm font-medium rounded-lg text-white/70 data-[state=active]:bg-[#282828] data-[state=active]:text-white transition-all"
          >
            <UserPlus className="h-4 w-4 mr-2 text-[#1f8cf9]" />
            Bergabung
          </TabsTrigger>
        </TabsList>
        
        {/* Demo Meeting Tab */}
        <TabsContent value="demo" className="mt-0 w-full">
          <DemoMeetingTab />
        </TabsContent>
        
        {/* Join by Code Tab */}
        <TabsContent value="join" className="mt-0 w-full">
          <JoinByCode onBack={() => router.push('/?tab=demo')} />
        </TabsContent>
      </ShadcnTabs>
    </div>
  )
}

function DemoMeetingTab() {
  const router = useRouter()
  const [e2ee, setE2ee] = useState(false)
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64))
  const [roomCreated, setRoomCreated] = useState(false)
  const [roomData, setRoomData] = useState<{
    roomId: string;
    code: string;
    url: string;
  } | null>(null)

  const createRoom = () => {
    const { roomId, code } = generateRoomWithCode()
    let roomUrl = `${window.location.origin}/rooms/${roomId}`
    
    if (e2ee) {
      roomUrl += `#${encodePassphrase(sharedPassphrase)}`
    }

    setRoomData({ roomId, code, url: roomUrl })
    setRoomCreated(true)
  }

  const startMeeting = () => {
    if (roomData) {
      if (e2ee) {
        router.push(`/rooms/${roomData.roomId}#${encodePassphrase(sharedPassphrase)}`)
      } else {
        router.push(`/rooms/${roomData.roomId}`)
      }
    }
  }

  const resetForm = () => {
    setRoomCreated(false)
    setRoomData(null)
    setE2ee(false)
    setSharedPassphrase(randomString(64))
  }

  if (roomCreated && roomData) {
    return (
      <div className="space-y-4">
        <RoomCodeDisplay
          roomCode={roomData.code}
          roomUrl={roomData.url}
          hasE2EE={e2ee}
          passphrase={e2ee ? sharedPassphrase : undefined}
          onStartMeeting={startMeeting}
        />
        <Button
          onClick={resetForm}
          variant="outline"
          className="w-full h-11 border-white/10 bg-[#1a1a1a] hover:bg-[#222222] text-white rounded-xl"
        >
          Buat Meeting Baru
        </Button>
      </div>
    )
  }

  return (
    <Card className="border border-white/10 bg-[#161616] text-white shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="text-center pb-4 pt-6">
        <div className="mx-auto mb-3 w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#1f8cf9]">
          <Video className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-semibold text-white">
          Buat Meeting Baru
        </CardTitle>
        <CardDescription className="text-sm text-neutral-400">
          Mulai video conference instan dengan kode unik. Tidak perlu registrasi akun.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5 p-6 pt-2">
        <Button
          onClick={createRoom}
          className="w-full h-12 text-sm font-medium bg-[#1f8cf9] hover:bg-[#1a7ad9] text-white shadow-lg shadow-[#1f8cf9]/20 transition-all rounded-xl"
          size="lg"
        >
          <Hash className="h-4 w-4 mr-2" />
          Buat Meeting dengan Kode
        </Button>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
            <Checkbox
              id="use-e2ee"
              checked={e2ee}
              onCheckedChange={(checked) => setE2ee(checked as boolean)}
              className="mt-0.5 border-white/20 data-[state=checked]:bg-[#1f8cf9] data-[state=checked]:border-[#1f8cf9]"
            />
            <div className="space-y-1">
              <Label htmlFor="use-e2ee" className="text-sm font-medium text-white flex items-center cursor-pointer">
                <Shield className="h-4 w-4 mr-2 text-emerald-400" />
                Aktifkan enkripsi end-to-end (E2EE)
              </Label>
              <p className="text-xs text-neutral-400">Enkripsi stream video dan audio secara langsung di sisi browser</p>
            </div>
          </div>

          {e2ee && (
            <div className="space-y-3 p-4 rounded-xl bg-[#1a1a1a] border border-emerald-500/30">
              <Label
                htmlFor="passphrase"
                className="text-xs font-medium flex items-center text-emerald-400"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Kata Sandi Enkripsi
              </Label>
              <Input
                id="passphrase"
                type="password"
                value={sharedPassphrase}
                onChange={(ev) => setSharedPassphrase(ev.target.value)}
                placeholder="Masukkan kata sandi"
                className="bg-[#111111] border-white/15 text-white focus:border-emerald-500 rounded-lg h-10 text-sm"
              />
              <p className="text-[11px] text-neutral-400">
                Bagikan kata sandi ini dengan peserta lain secara aman
              </p>
            </div>
          )}

          <div className="bg-[#121212] rounded-xl p-4 border border-white/10">
            <h4 className="font-medium text-xs text-neutral-300 mb-2 flex items-center">
              <Hash className="h-3.5 w-3.5 mr-1.5 text-[#1f8cf9]" />
              Cara Kerja Room Meeting
            </h4>
            <ul className="text-xs text-neutral-400 space-y-1.5">
              <li>• Meeting menghasilkan kode 6 karakter alfanumerik</li>
              <li>• Bagikan kode atau tautan langsung kepada rekan kerja</li>
              <li>• Kompatibel dengan semua browser WebRTC modern</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <Card className="border border-white/10 bg-[#161616] hover:border-white/20 transition-all duration-200 rounded-xl">
      <CardContent className="p-6 text-left">
        <div className="mb-4 w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white">
          <Icon className="h-5 w-5 text-[#1f8cf9]" />
        </div>
        <h3 className="font-medium text-base text-white mb-1.5">{title}</h3>
        <p className="text-xs text-neutral-400 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  const features = [
    {
      icon: Video,
      title: "HD Video & Audio",
      description: "Kualitas streaming adaptif dengan kompresi VP9/AV1 untuk pengalaman audio-video yang jernih.",
    },
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "Keamanan tingkat tinggi melindungi setiap percakapan dengan kunci enkripsi privat.",
    },
    {
      icon: Users,
      title: "Multi-Participant",
      description: "Mendukung koneksi multi-partisipan dengan alokasi bandwidth cerdas (Dynacast).",
    },
    {
      icon: Zap,
      title: "Real-time Performance",
      description: "Infrastruktur WebRTC berlatensi ultra-rendah untuk kolaborasi tanpa hambatan.",
    },
    {
      icon: Globe,
      title: "Global Infrastructure",
      description: "Konektivitas global terdistribusi untuk kualitas meeting optimal dari mana saja.",
    },
    {
      icon: Heart,
      title: "Built with Empathy",
      description: "Dirancang dengan fokus pada kenyamanan, privasi, dan kemudahan kolaborasi tim.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-between" data-lk-theme="default">
      <main className="w-full">
        {/* Hero Section */}
        <div className="pt-16 pb-12 px-6">
          <div className="w-full max-w-5xl mx-auto text-center space-y-10">
            {/* Header Content */}
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-[#1f8cf9]" />
                <span>Powered by LiveKit WebRTC</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
                KolabEmpati
              </h1>
              
              <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed max-w-2xl mx-auto">
                Platform video conferencing modern untuk kolaborasi real-time yang aman, andal, dan berkinerja tinggi.
              </p>

              <div className="flex items-center justify-center space-x-3 text-xs text-neutral-400 pt-1">
                <span className="inline-flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Gratis</span>
                <span>•</span>
                <span className="inline-flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> E2EE Ready</span>
                <span>•</span>
                <span className="inline-flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> WebRTC Standar</span>
              </div>
            </div>

            {/* Main Action Tabs */}
            <div className="flex justify-center pt-2">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center p-8 text-neutral-400 text-sm">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1f8cf9] mr-2"></div>
                    Memuat...
                  </div>
                }
              >
                <TabsComponent />
              </Suspense>
            </div>

            {/* AI Emotion Feature Card */}
            <div className="max-w-lg mx-auto pt-6">
              <Card className="border border-white/10 bg-[#161616] text-white rounded-2xl overflow-hidden shadow-xl text-left">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#1f8cf9]">
                      <Brain className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[11px] border-white/15 bg-white/5 text-neutral-300">
                      AI Experimental
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-white mt-3">
                    Deteksi Emosi Wajah (Face-API)
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400">
                    Analisis ekspresi emosi real-time langsung di browser tanpa menyimpan data video Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-1">
                  <Button
                    onClick={() => window.open('/emotion', '_blank')}
                    variant="outline"
                    className="w-full h-11 text-sm font-medium border-white/15 bg-[#1f1f1f] hover:bg-[#282828] text-white rounded-xl flex items-center justify-center"
                  >
                    Buka Deteksi Emosi
                    <ArrowUpRight className="h-4 w-4 ml-1.5 text-neutral-400" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Grid Section */}
        <div className="py-16 px-6 border-t border-white/10 bg-[#0e0e0e]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Keunggulan Arsitektur
              </h2>
              <p className="text-sm text-neutral-400 max-w-xl mx-auto">
                Dibangun di atas fondasi teknologi WebRTC LiveKit kelas industri
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* LiveKit Style Footer */}
      <footer className="border-t border-white/10 bg-[#111111] py-10" data-lk-theme="default">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">KolabEmpati</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Platform video conferencing modern berbasis LiveKit WebRTC dan Face-API AI.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Teknologi</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Next.js, LiveKit Client SDK, E2EE WebCrypto API, Face-API.js.
              </p>
            </div>

            <div className="md:text-right">
              <h4 className="font-medium text-white mb-2">Infrastruktur</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Konektivitas SFU LiveKit Cloud dengan protokol WebRTC standar.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>
              Powered by <a href="https://livekit.io" target="_blank" rel="noopener noreferrer" className="text-[#1f8cf9] hover:underline">LiveKit</a> • KolabEmpati Platform
            </p>
            <div className="flex items-center space-x-4">
              <span className="flex items-center"><Shield className="h-3 w-3 mr-1" /> Secure</span>
              <span className="flex items-center"><Zap className="h-3 w-3 mr-1" /> Ultra-low Latency</span>
              <span className="flex items-center"><Heart className="h-3 w-3 mr-1" /> Empathetic</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

