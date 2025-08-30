"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Droplets, Clock, AlertCircle, CheckCircle2, RefreshCw, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CaptchaChallenge {
  question: string
  answer: number
  id: string
}

export function FaucetSection() {
  const [address, setAddress] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const [lastRequest, setLastRequest] = useState<Date | null>(null)
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    generateCaptcha()
  }, [])

  const generateCaptcha = () => {
    const operations = ["+", "-", "*"]
    const operation = operations[Math.floor(Math.random() * operations.length)]

    let num1: number, num2: number, answer: number, question: string

    switch (operation) {
      case "+":
        num1 = Math.floor(Math.random() * 50) + 1
        num2 = Math.floor(Math.random() * 50) + 1
        answer = num1 + num2
        question = `${num1} + ${num2}`
        break
      case "-":
        num1 = Math.floor(Math.random() * 50) + 25
        num2 = Math.floor(Math.random() * 25) + 1
        answer = num1 - num2
        question = `${num1} - ${num2}`
        break
      case "*":
        num1 = Math.floor(Math.random() * 12) + 1
        num2 = Math.floor(Math.random() * 12) + 1
        answer = num1 * num2
        question = `${num1} × ${num2}`
        break
      default:
        num1 = 5
        num2 = 3
        answer = 8
        question = "5 + 3"
    }

    setCaptcha({
      question,
      answer,
      id: Math.random().toString(36).substring(7),
    })
    setCaptchaAnswer("")
    setCaptchaVerified(false)
  }

  const verifyCaptcha = () => {
    if (!captcha || !captchaAnswer.trim()) {
      toast({
        title: "Captcha required",
        description: "Please solve the math problem to continue",
        variant: "destructive",
      })
      return false
    }

    const userAnswer = Number.parseInt(captchaAnswer.trim())
    if (isNaN(userAnswer) || userAnswer !== captcha.answer) {
      toast({
        title: "Incorrect answer",
        description: "Please solve the math problem correctly",
        variant: "destructive",
      })
      generateCaptcha() // Generate new captcha on wrong answer
      return false
    }

    setCaptchaVerified(true)
    toast({
      title: "Captcha verified",
      description: "You can now request tokens",
    })
    return true
  }

  const handleFaucetRequest = async () => {
    if (!address) {
      toast({
        title: "Address required",
        description: "Please enter a valid wallet address",
        variant: "destructive",
      })
      return
    }

    // Basic address validation
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    // Verify captcha if not already verified
    if (!captchaVerified && !verifyCaptcha()) {
      return
    }

    setIsRequesting(true)
    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          captchaId: captcha?.id,
          captchaAnswer: captcha?.answer,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setLastRequest(new Date())
        toast({
          title: "Tokens sent!",
          description: `Successfully sent 1 STT to ${address.slice(0, 6)}...${address.slice(-4)}`,
        })
        setAddress("")
        // Generate new captcha for next request
        generateCaptcha()
      } else {
        toast({
          title: "Request failed",
          description: data.error || "Failed to send tokens. Please try again.",
          variant: "destructive",
        })
        // Generate new captcha on failure
        generateCaptcha()
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to connect to faucet. Please try again.",
        variant: "destructive",
      })
      // Generate new captcha on error
      generateCaptcha()
    } finally {
      setIsRequesting(false)
    }
  }

  const canRequest = !lastRequest || Date.now() - lastRequest.getTime() > 24 * 60 * 60 * 1000

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Droplets className="w-5 h-5" />
            Somnia Testnet Faucet
          </CardTitle>
          <CardDescription>Get free STT tokens for testing and development on Somnia Testnet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Wallet Address</Label>
            <Input
              id="address"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="captcha" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Verification
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Solve:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{captcha?.question} = ?</code>
                  <Button variant="ghost" size="sm" onClick={generateCaptcha} className="h-6 w-6 p-0">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  id="captcha"
                  placeholder="Enter your answer"
                  value={captchaAnswer}
                  onChange={(e) => {
                    setCaptchaAnswer(e.target.value)
                    setCaptchaVerified(false)
                  }}
                  className="font-mono"
                  type="number"
                />
              </div>
              {!captchaVerified && (
                <Button variant="outline" onClick={verifyCaptcha} className="self-end bg-transparent">
                  Verify
                </Button>
              )}
            </div>
            {captchaVerified && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Captcha verified successfully
              </div>
            )}
          </div>

          <Button
            onClick={handleFaucetRequest}
            disabled={isRequesting || !canRequest || !captchaVerified}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Sending Tokens...
              </>
            ) : (
              <>
                <Droplets className="w-4 h-4 mr-2" />
                Request 1 STT
              </>
            )}
          </Button>

          {!canRequest && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                You can request tokens again in{" "}
                {Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - lastRequest!.getTime())) / (60 * 60 * 1000))} hours.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Faucet Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Amount per Request</span>
            </div>
            <p className="text-2xl font-bold">1 STT</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Rate Limit</span>
            </div>
            <p className="text-2xl font-bold">24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="font-medium">Network</span>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              Somnia Testnet
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> These are testnet tokens with no real value. Use them only for testing and
          development purposes on Somnia Testnet.
        </AlertDescription>
      </Alert>
    </div>
  )
}
