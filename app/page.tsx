"use client"

import Link from "next/link"
import { Droplets, Network, Search, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { WalletConnection } from "@/components/wallet-connection"
import { FaucetSection } from "@/components/faucet-section"
import { ExplorerSection } from "@/components/explorer-section"

export default function SomniaDevTools() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Somnia DevTools</h1>
                  <p className="text-sm text-muted-foreground">Testnet Faucet & Explorer</p>
                </div>
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <Badge
                variant="secondary"
                className="border-green-500/20 bg-green-500/10 text-green-600"
              >
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                Testnet
              </Badge>
              <WalletConnection />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold text-foreground">
              Somnia Testnet Developer Tools
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-xl text-muted-foreground">
              Get testnet tokens instantly and explore the Somnia blockchain with our comprehensive
              developer toolkit.
            </p>
          </div>

          {/* Main Tools */}
          <Tabs defaultValue="faucet" className="w-full">
            <TabsList className="mb-8 grid w-full grid-cols-2">
              <TabsTrigger value="faucet" className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Faucet
              </TabsTrigger>
              <TabsTrigger value="explorer" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Explorer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="faucet">
              <FaucetSection />
            </TabsContent>

            <TabsContent value="explorer">
              <ExplorerSection />
            </TabsContent>
          </Tabs>

          {/* Network Info */}
          <Card className="mt-12 border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Network Information
              </CardTitle>
              <CardDescription>
                Somnia Testnet connection details and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Network Name</p>
                  <p className="font-mono text-sm">Somnia Testnet</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Chain ID</p>
                  <p className="font-mono text-sm">50312</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Currency</p>
                  <p className="font-mono text-sm">STT</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}