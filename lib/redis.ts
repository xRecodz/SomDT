import { kv } from "@vercel/kv"

export interface FaucetRequest {
  address: string
  timestamp: number
  txHash?: string
  amount: string
}

export interface RateLimitResult {
  allowed: boolean
  remainingTime?: number
  nextRequestTime?: number
}

export class FaucetRateLimit {
  private static readonly RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours
  private static readonly MAX_REQUESTS = 1

  static async checkRateLimit(address: string): Promise<RateLimitResult> {
    const key = `faucet:${address.toLowerCase()}`
    const lastRequest = await kv.get<FaucetRequest>(key)

    if (!lastRequest) {
      return { allowed: true }
    }

    const timeSinceLastRequest = Date.now() - lastRequest.timestamp

    if (timeSinceLastRequest >= this.RATE_LIMIT_WINDOW) {
      return { allowed: true }
    }

    const remainingTime = this.RATE_LIMIT_WINDOW - timeSinceLastRequest
    const nextRequestTime = lastRequest.timestamp + this.RATE_LIMIT_WINDOW

    return {
      allowed: false,
      remainingTime,
      nextRequestTime,
    }
  }

  static async recordRequest(address: string, txHash: string, amount: string): Promise<void> {
    const key = `faucet:${address.toLowerCase()}`
    const requestData: FaucetRequest = {
      address: address.toLowerCase(),
      timestamp: Date.now(),
      txHash,
      amount,
    }

    // Store with expiration
    await kv.set(key, requestData, {
      ex: Math.ceil(this.RATE_LIMIT_WINDOW / 1000),
    })

    // Also store in global log for monitoring
    const globalKey = `faucet:log:${Date.now()}`
    await kv.set(globalKey, requestData, {
      ex: 7 * 24 * 60 * 60, // Keep for 7 days
    })
  }

  static async getRequestHistory(address: string): Promise<FaucetRequest | null> {
    const key = `faucet:${address.toLowerCase()}`
    return await kv.get<FaucetRequest>(key)
  }
}

export class ExplorerCache {
  private static readonly CACHE_TTL = 30 // 30 seconds for block/tx data

  static async cacheBlock(blockNumber: string, blockData: any): Promise<void> {
    const key = `block:${blockNumber}`
    await kv.set(key, blockData, { ex: this.CACHE_TTL })
  }

  static async getCachedBlock(blockNumber: string): Promise<any> {
    const key = `block:${blockNumber}`
    return await kv.get(key)
  }

  static async cacheTransaction(txHash: string, txData: any): Promise<void> {
    const key = `tx:${txHash}`
    await kv.set(key, txData, { ex: this.CACHE_TTL })
  }

  static async getCachedTransaction(txHash: string): Promise<any> {
    const key = `tx:${txHash}`
    return await kv.get(key)
  }
}
