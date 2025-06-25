import { videoCodecs } from "livekit-client"
import { VideoConferenceClientImpl } from "./VideoConferenceClientImpl"
import { isVideoCodec } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, Globe, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default async function CustomRoomConnection(props: {
  searchParams: Promise<{
    liveKitUrl?: string
    token?: string
    codec?: string
  }>
}) {
  const { liveKitUrl, token, codec } = await props.searchParams

  if (typeof liveKitUrl !== "string") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="max-w-md w-full border-2 border-destructive/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-destructive">Missing LiveKit URL</CardTitle>
            <CardDescription className="text-base">
              Mohon berikan URL server LiveKit yang valid untuk melanjutkan.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">Format: wss://your-server.livekit.cloud</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Yang Dibutuhkan:
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• URL server LiveKit yang valid</li>
                <li>• Access token yang sesuai</li>
                <li>• Koneksi internet yang stabil</li>
              </ul>
            </div>
            <Link href="/" className="block">
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (typeof token !== "string") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="max-w-md w-full border-2 border-destructive/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-destructive">Missing LiveKit Token</CardTitle>
            <CardDescription className="text-base">
              Mohon berikan access token yang valid untuk bergabung dengan meeting.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">Token JWT diperlukan untuk autentikasi</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                Tentang Access Token:
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Token JWT yang dihasilkan server LiveKit</li>
                <li>• Berisi informasi room dan permissions</li>
                <li>• Memiliki waktu kedaluwarsa tertentu</li>
              </ul>
            </div>
            <Link href="/" className="block">
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (codec !== undefined && !isVideoCodec(codec)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="max-w-md w-full border-2 border-destructive/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-amber-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-destructive">Invalid Codec</CardTitle>
            <CardDescription className="text-base">
              Codec harus salah satu dari: {videoCodecs.join(", ")}.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">Pilih codec yang didukung oleh sistem</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-amber-500" />
                Codec yang Didukung:
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {videoCodecs.map((codec) => (
                  <span key={codec} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-mono">
                    {codec}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/" className="block">
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main data-lk-theme="default" style={{ height: "100%" }}>
      <VideoConferenceClientImpl liveKitUrl={liveKitUrl} token={token} codec={codec} />
    </main>
  )
}
