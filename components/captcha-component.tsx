"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Shield, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CaptchaChallenge {
  question: string
  answer: number
  id: string
}

interface CaptchaComponentProps {
  onVerified: (captchaId: string, answer: number) => void
  onReset: () => void
  className?: string
}

export function CaptchaComponent({ onVerified, onReset, className }: CaptchaComponentProps) {
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [isVerified, setIsVerified] = useState(false)
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

    const newCaptcha = {
      question,
      answer,
      id: Math.random().toString(36).substring(7),
    }

    setCaptcha(newCaptcha)
    setUserAnswer("")
    setIsVerified(false)
    onReset()
  }

  const verifyCaptcha = () => {
    if (!captcha || !userAnswer.trim()) {
      toast({
        title: "Answer required",
        description: "Please solve the math problem",
        variant: "destructive",
      })
      return
    }

    const answer = Number.parseInt(userAnswer.trim())
    if (isNaN(answer) || answer !== captcha.answer) {
      toast({
        title: "Incorrect answer",
        description: "Please solve the math problem correctly",
        variant: "destructive",
      })
      generateCaptcha()
      return
    }

    setIsVerified(true)
    onVerified(captcha.id, captcha.answer)
    toast({
      title: "Captcha verified",
      description: "Security verification successful",
    })
  }

  return (
    <div className={className}>
      <Label className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4" />
        Security Verification
      </Label>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Solve:</span>
          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{captcha?.question} = ?</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateCaptcha}
            className="h-6 w-6 p-0"
            title="Generate new problem"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter your answer"
            value={userAnswer}
            onChange={(e) => {
              setUserAnswer(e.target.value)
              setIsVerified(false)
            }}
            className="font-mono flex-1"
            type="number"
            disabled={isVerified}
          />
          {!isVerified && (
            <Button variant="outline" onClick={verifyCaptcha}>
              Verify
            </Button>
          )}
        </div>

        {isVerified && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Captcha verified successfully
          </div>
        )}
      </div>
    </div>
  )
}
