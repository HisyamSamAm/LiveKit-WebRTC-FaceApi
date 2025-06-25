"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type React from "react"
import { Suspense, useState } from "react"
import { encodePassphrase, generateRoomId, randomString, generateRoomWithCode } from "@/lib/client-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Video, Shield, Users, Zap, Globe, Lock, Play, Settings, Sparkles, Heart, CheckCircle, Brain, Hash, UserPlus } from "lucide-react"
import { JoinByCode } from "@/components/JoinByCode"
import { RoomCodeDisplay } from "@/components/RoomCodeDisplay"

// NOTE: Custom server tab is temporarily disabled
// Only Demo tab is available for now
// To re-enable, uncomment the CustomConnectionTab function and TabsList below

function TabsComponent(props: React.PropsWithChildren<{}>) {
  const searchParams = useSearchParams()
  // Support for join tab
  const currentTab = searchParams?.get("tab") === "join" ? "join" : "demo"

  const router = useRouter()
  function onTabChange(value: string) {
    router.push(`/?tab=${value}`)
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <ShadcnTabs value={currentTab} onValueChange={onTabChange} className="w-full">
        {/* Tabs for Demo and Join by Code */}
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger value="demo" className="text-base font-medium">
            <Play className="h-4 w-4 mr-2" />
            Buat Meeting
          </TabsTrigger>
          <TabsTrigger value="join" className="text-base font-medium">
            <UserPlus className="h-4 w-4 mr-2" />
            Bergabung
          </TabsTrigger>
        </TabsList>
        
        {/* Demo Meeting Tab */}
        <TabsContent value="demo" className="mt-0 w-full flex justify-center">
          <div className="w-full max-w-lg">
            <DemoMeetingTab />
          </div>
        </TabsContent>
        
        {/* Join by Code Tab */}
        <TabsContent value="join" className="mt-0 w-full flex justify-center">
          <div className="w-full max-w-lg">
            <JoinByCode onBack={() => router.push('/?tab=demo')} />
          </div>
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
          className="w-full"
        >
          Buat Meeting Baru
        </Button>
      </div>
    )
  }
  return (
    <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-card to-card/50 w-full mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Video className="h-8 w-8 text-white" />
        </div>        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Buat Meeting Baru
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Buat meeting dengan kode unik yang mudah dibagikan.
          <br />
          Tidak perlu registrasi atau instalasi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          onClick={createRoom}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Hash className="h-5 w-5 mr-2" />
          Buat Meeting dengan Kode
        </Button>

        <div className="space-y-4 pt-2">
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border">
            <Checkbox
              id="use-e2ee"
              checked={e2ee}
              onCheckedChange={(checked) => setE2ee(checked as boolean)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="use-e2ee" className="text-sm font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                Aktifkan enkripsi end-to-end
              </Label>
              <p className="text-xs text-muted-foreground">Lindungi percakapan Anda dengan enkripsi tingkat militer</p>
            </div>
          </div>

          {e2ee && (
            <div className="space-y-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <Label
                htmlFor="passphrase"
                className="text-sm font-medium flex items-center text-green-700 dark:text-green-400"
              >
                <Lock className="h-4 w-4 mr-2" />
                Kata Sandi Enkripsi
              </Label>
              <Input
                id="passphrase"
                type="password"
                value={sharedPassphrase}
                onChange={(ev) => setSharedPassphrase(ev.target.value)}
                placeholder="Masukkan kata sandi"
                className="border-green-300 dark:border-green-700 focus:border-green-500"
              />
              <p className="text-xs text-green-600 dark:text-green-400">
                Bagikan kata sandi ini dengan peserta lain secara aman
              </p>            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 border">
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Cara Kerja Kode Meeting
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Meeting akan mendapat kode unik 6 karakter</li>
              <li>• Bagikan kode ke peserta untuk bergabung</li>
              <li>• Peserta dapat masuk via tab "Bergabung"</li>
              <li>• Kode berlaku selama meeting aktif</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* 
// CustomConnectionTab function - Currently disabled
function CustomConnectionTab() {
  const router = useRouter()
  const [e2ee, setE2ee] = useState(false)
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64))

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    const serverUrl = formData.get("serverUrl")
    const token = formData.get("token")
    if (e2ee) {
      router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}#${encodePassphrase(sharedPassphrase)}`)
    } else {
      router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}`)
    }
  }
  return (
    <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-2xl bg-gradient-to-br from-card to-orange-50/50 dark:to-orange-950/20 w-full mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Globe className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Koneksi Kustom
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Hubungkan dengan server LiveKit Anda sendiri untuk kontrol penuh.
          <br />
          Cocok untuk enterprise dan penggunaan advanced.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="serverUrl" className="text-sm font-medium flex items-center">
              <Globe className="h-4 w-4 mr-2 text-blue-600" />
              LiveKit Server URL
            </Label>
            <Input
              id="serverUrl"
              name="serverUrl"
              type="url"
              placeholder="wss://your-server.livekit.cloud"
              required
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">URL server LiveKit Cloud atau self-hosted server Anda</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="token" className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-purple-600" />
              Access Token
            </Label>
            <textarea
              id="token"
              name="token"
              placeholder="Paste your LiveKit access token here..."
              required
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono"
            />
            <p className="text-xs text-muted-foreground">Token JWT yang dihasilkan dari LiveKit server Anda</p>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border">
            <Checkbox
              id="use-e2ee-custom"
              checked={e2ee}
              onCheckedChange={(checked) => setE2ee(checked as boolean)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="use-e2ee-custom" className="text-sm font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                Aktifkan enkripsi end-to-end
              </Label>
              <p className="text-xs text-muted-foreground">Tambahan keamanan untuk server kustom Anda</p>
            </div>
          </div>

          {e2ee && (
            <div className="space-y-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <Label
                htmlFor="passphrase-custom"
                className="text-sm font-medium flex items-center text-green-700 dark:text-green-400"
              >
                <Lock className="h-4 w-4 mr-2" />
                Kata Sandi Enkripsi
              </Label>
              <Input
                id="passphrase-custom"
                type="password"
                value={sharedPassphrase}
                onChange={(ev) => setSharedPassphrase(ev.target.value)}
                placeholder="Masukkan kata sandi"
                className="border-green-300 dark:border-green-700 focus:border-green-500"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            Hubungkan ke Server
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
*/

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <Card className="border-0 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6 text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function Page() {  const features = [
    {
      icon: Video,
      title: "HD Video & Audio",
      description: "Kualitas video hingga 4K dan audio crystal clear untuk pengalaman terbaik",
    },
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "Keamanan tingkat militer melindungi setiap percakapan Anda",
    },
    {
      icon: Users,
      title: "Multi-Participant",
      description: "Dukung hingga ratusan peserta dalam satu meeting",
    },
    {
      icon: Zap,
      title: "Real-time Performance",
      description: "Latensi ultra-rendah untuk kolaborasi yang seamless",
    },
    {
      icon: Globe,
      title: "Global Infrastructure",
      description: "Server tersebar di seluruh dunia untuk koneksi optimal",
    },
    {
      icon: Heart,
      title: "Built with Empathy",
      description: "Dirancang dengan memahami kebutuhan kolaborasi modern",
    },
  ]

  return (
    <>
      <main
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
        data-lk-theme="default"
      >
        {/* Hero Section */}
        <div className="pt-20 pb-12 px-8">
          <div className="w-full max-w-6xl mx-auto text-center space-y-12">
            {/* Main Hero */}
            <div className="space-y-8">
              <div className="mx-auto relative max-w-4xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-card via-card to-muted/30 rounded-3xl p-12 border-2 border-primary/10 shadow-2xl">
                  <div className="flex items-center justify-center mb-6">
                    <Badge
                      variant="secondary"
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 text-blue-700 dark:text-blue-300 border-0"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Powered by LiveKit
                    </Badge>
                  </div>
                  <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
                    KolabEmpati
                  </h1>
                  <p className="text-2xl text-muted-foreground font-medium mb-6">
                    🎥 Modern Video Conferencing Platform
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Gratis</span>
                    <span>•</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Aman</span>
                    <span>•</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Mudah Digunakan</span>
                  </div>
                </div>
              </div>

              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl md:text-3xl text-muted-foreground leading-relaxed font-light">
                  Platform kolaborasi video modern yang dibangun dengan teknologi canggih untuk pengalaman komunikasi
                  <span className="text-primary font-medium"> real-time yang seamless</span> dan penuh empati.
                </h2>
              </div>            </div>            {/* Main CTA */}
            <div className="flex justify-center">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Memuat...</span>
                  </div>
                }
              >
                <TabsComponent />
              </Suspense>
            </div>

            {/* Additional Features - Emotion Detection */}
            <div className="max-w-4xl mx-auto mt-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Fitur Tambahan</h3>
                <p className="text-muted-foreground">Eksplorasi teknologi AI untuk komunikasi yang lebih empati</p>
              </div>
              
              <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-2xl bg-gradient-to-br from-card to-purple-50/50 dark:to-purple-950/20 w-full max-w-2xl mx-auto">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Deteksi Emosi AI
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Analisis emosi real-time menggunakan kecerdasan buatan untuk komunikasi yang lebih empati.
                    <br />
                    <span className="text-purple-600 dark:text-purple-400 font-medium">Fitur eksperimental - Standalone</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Real-time Detection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>7 Emosi Dasar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Privacy First</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>No Data Storage</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open('/emotion', '_blank')}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Brain className="h-5 w-5 mr-2" />
                    Coba Deteksi Emosi
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Fitur ini berjalan terpisah dari video conference dan menggunakan Face API.js
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 px-8 bg-gradient-to-t from-muted/30 to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mengapa Memilih KolabEmpati?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Fitur-fitur canggih yang dirancang untuk memberikan pengalaman video conferencing terbaik
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer
        className="border-t bg-gradient-to-r from-card to-muted/20 text-card-foreground py-12"
        data-lk-theme="default"
      >
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-left">
              <h3 className="font-bold text-lg mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                KolabEmpati
              </h3>
              <p className="text-sm text-muted-foreground">
                Platform video conferencing modern untuk kolaborasi yang lebih baik
              </p>
            </div>

            <div className="text-center">
              <h4 className="font-semibold mb-2">Teknologi</h4>
              <p className="text-sm text-muted-foreground">
                Dibangun dengan Next.js, LiveKit, dan teknologi WebRTC terdepan
              </p>
            </div>

            <div className="text-center md:text-right">
              <h4 className="font-semibold mb-2">Open Source</h4>
              <p className="text-sm text-muted-foreground">
                Kode sumber terbuka dan dapat dikustomisasi sesuai kebutuhan
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Powered by{" "}
              <a
                href="https://livekit.io/cloud?ref=meet"
                rel="noopener"
                className="text-primary hover:underline font-medium transition-colors"
              >
                LiveKit Cloud
              </a>{" "}
              • Built with ❤️ for seamless collaboration
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Secure
              </span>
              <span className="flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                Fast
              </span>
              <span className="flex items-center">
                <Heart className="h-3 w-3 mr-1" />
                Empathetic
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
