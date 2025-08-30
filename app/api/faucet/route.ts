import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { Wallet, JsonRpcProvider } from "ethers"

// Somnia Testnet configuration
const SOMNIA_RPC_URL = "https://dream-rpc.somnia.network"
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY
const FAUCET_AMOUNT = "1000000000000000000" // 1 STT in wei

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours

interface FaucetRequest {
  address: string
  timestamp: number
  txHash?: string
}

async function sendTokens(toAddress: string, amount: string): Promise<string> {
  try {
    const provider = new JsonRpcProvider(SOMNIA_RPC_URL)
    const wallet = new Wallet(FAUCET_PRIVATE_KEY!, provider)

    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amount,
      gasLimit: 21000,
    })

    console.log(`[v0] Sending ${amount} wei to ${toAddress}`)

    return tx.hash
  } catch (error) {
    console.error("[v0] Error sending tokens:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, captchaId, captchaAnswer } = await request.json()

    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ error: "Invalid Ethereum address format" }, { status: 400 })
    }

    // TODO: captcha validation

    // Rate limiting
    const key = `faucet:${address}`
    const lastRequest: FaucetRequest | null = await kv.get(key)
    const now = Date.now()

    if (lastRequest && now - lastRequest.timestamp < RATE_LIMIT_WINDOW) {
      return NextResponse.json({ error: "You can only request once per 24 hours" }, { status: 429 })
    }

    // Send transaction
    const txHash = await sendTokens(address, FAUCET_AMOUNT)

    const faucetRequest: FaucetRequest = { address, timestamp: now, txHash }
    await kv.set(key, faucetRequest)

    return NextResponse.json({ txHash })
  } catch (error: any) {
    console.error("[v0] Faucet error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
