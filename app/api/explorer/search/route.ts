import { type NextRequest, NextResponse } from "next/server"

const SOMNIA_RPC_URL = "https://dream-rpc.somnia.network"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const trimmedQuery = query.trim()

    // Determine query type and search accordingly
    let searchResult = null
    let searchType = ""

    // Check if it's a block number (numeric)
    if (/^\d+$/.test(trimmedQuery)) {
      searchResult = await searchBlock(trimmedQuery)
      searchType = "block"
    }
    // Check if it's a transaction hash (0x followed by 64 hex chars)
    else if (/^0x[a-fA-F0-9]{64}$/.test(trimmedQuery)) {
      searchResult = await searchTransaction(trimmedQuery)
      searchType = "transaction"
    }
    // Check if it's an address (0x followed by 40 hex chars)
    else if (/^0x[a-fA-F0-9]{40}$/.test(trimmedQuery)) {
      searchResult = await searchAddress(trimmedQuery)
      searchType = "address"
    }
    // Check if it's a block hash (0x followed by 64 hex chars, same as tx hash)
    else if (/^0x[a-fA-F0-9]{64}$/.test(trimmedQuery)) {
      // Try as block hash first, then transaction hash
      try {
        searchResult = await searchBlockByHash(trimmedQuery)
        searchType = "block"
      } catch {
        searchResult = await searchTransaction(trimmedQuery)
        searchType = "transaction"
      }
    } else {
      return NextResponse.json(
        { error: "Invalid search query format. Please enter a block number, transaction hash, or address." },
        { status: 400 },
      )
    }

    if (!searchResult) {
      return NextResponse.json({ error: "No results found for the given query" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      type: searchType,
      result: searchResult,
      query: trimmedQuery,
    })
  } catch (error) {
    console.error("[v0] Explorer search error:", error)

    return NextResponse.json({ error: "Search failed. Please try again later." }, { status: 500 })
  }
}

async function rpcCall(method: string, params: any[] = []) {
  const response = await fetch(SOMNIA_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: Date.now(),
    }),
  })

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status}`)
  }

  const result = await response.json()

  if (result.error) {
    throw new Error(`RPC error: ${result.error.message}`)
  }

  return result.result
}

async function searchBlock(blockNumber: string) {
  try {
    const blockHex = `0x${Number.parseInt(blockNumber).toString(16)}`
    const block = await rpcCall("eth_getBlockByNumber", [blockHex, false])

    if (!block) return null

    return {
      number: Number.parseInt(block.number, 16).toString(),
      hash: block.hash,
      timestamp: block.timestamp,
      transactions: block.transactions || [],
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
      parentHash: block.parentHash,
      miner: block.miner,
      difficulty: block.difficulty,
      totalDifficulty: block.totalDifficulty,
    }
  } catch (error) {
    console.error("[v0] Error searching block:", error)
    return null
  }
}

async function searchBlockByHash(blockHash: string) {
  try {
    const block = await rpcCall("eth_getBlockByHash", [blockHash, false])

    if (!block) return null

    return {
      number: Number.parseInt(block.number, 16).toString(),
      hash: block.hash,
      timestamp: block.timestamp,
      transactions: block.transactions || [],
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
      parentHash: block.parentHash,
      miner: block.miner,
      difficulty: block.difficulty,
      totalDifficulty: block.totalDifficulty,
    }
  } catch (error) {
    console.error("[v0] Error searching block by hash:", error)
    return null
  }
}

async function searchTransaction(txHash: string) {
  try {
    const [tx, receipt] = await Promise.all([
      rpcCall("eth_getTransactionByHash", [txHash]),
      rpcCall("eth_getTransactionReceipt", [txHash]),
    ])

    if (!tx) return null

    return {
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      transactionIndex: tx.transactionIndex,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      gasUsed: receipt?.gasUsed || "0x0",
      status: receipt?.status || "0x0",
      nonce: tx.nonce,
      input: tx.input,
    }
  } catch (error) {
    console.error("[v0] Error searching transaction:", error)
    return null
  }
}

async function searchAddress(address: string) {
  try {
    const [balance, nonce, code] = await Promise.all([
      rpcCall("eth_getBalance", [address, "latest"]),
      rpcCall("eth_getTransactionCount", [address, "latest"]),
      rpcCall("eth_getCode", [address, "latest"]),
    ])

    const isContract = code && code !== "0x"

    return {
      address,
      balance,
      nonce: Number.parseInt(nonce, 16).toString(),
      isContract,
      code: isContract ? code : null,
    }
  } catch (error) {
    console.error("[v0] Error searching address:", error)
    return null
  }
}

// Get recent blocks endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "blocks"
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50)

    if (type === "blocks") {
      const latestBlockNumber = await rpcCall("eth_blockNumber")
      const latestBlock = Number.parseInt(latestBlockNumber, 16)

      const blocks = []
      for (let i = 0; i < limit; i++) {
        const blockNumber = latestBlock - i
        if (blockNumber < 0) break

        const block = await searchBlock(blockNumber.toString())
        if (block) blocks.push(block)
      }

      return NextResponse.json({
        success: true,
        type: "blocks",
        data: blocks,
      })
    }

    if (type === "transactions") {
      const latestBlockNumber = await rpcCall("eth_blockNumber")
      const latestBlock = Number.parseInt(latestBlockNumber, 16)

      const transactions = []
      let collected = 0

      // Look through recent blocks to find transactions
      for (let i = 0; i < 20 && collected < limit; i++) {
        const blockNumber = latestBlock - i
        if (blockNumber < 0) break

        const blockHex = `0x${blockNumber.toString(16)}`
        const block = await rpcCall("eth_getBlockByNumber", [blockHex, true]) // Get full transaction objects

        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (collected >= limit) break

            // Get transaction receipt for status
            const receipt = await rpcCall("eth_getTransactionReceipt", [tx.hash])

            transactions.push({
              hash: tx.hash,
              blockNumber: tx.blockNumber,
              blockHash: tx.blockHash,
              transactionIndex: tx.transactionIndex,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              gas: tx.gas,
              gasPrice: tx.gasPrice,
              gasUsed: receipt?.gasUsed || "0x0",
              status: receipt?.status || "0x0",
              nonce: tx.nonce,
              input: tx.input,
              timestamp: block.timestamp,
            })
            collected++
          }
        }
      }

      return NextResponse.json({
        success: true,
        type: "transactions",
        data: transactions,
      })
    }

    if (type === "address-transactions") {
      const address = searchParams.get("address")
      if (!address) {
        return NextResponse.json({ error: "Address parameter required" }, { status: 400 })
      }

      const transactions = await getAddressTransactions(address, limit)

      return NextResponse.json({
        success: true,
        type: "address-transactions",
        data: transactions,
        address,
      })
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error fetching recent data:", error)
    return NextResponse.json({ error: "Failed to fetch recent data" }, { status: 500 })
  }
}

async function getAddressTransactions(address: string, limit = 10) {
  const transactions = []
  const latestBlockNumber = await rpcCall("eth_blockNumber")
  const latestBlock = Number.parseInt(latestBlockNumber, 16)

  let collected = 0

  // Search through recent blocks for transactions involving this address
  for (let i = 0; i < 100 && collected < limit; i++) {
    const blockNumber = latestBlock - i
    if (blockNumber < 0) break

    const blockHex = `0x${blockNumber.toString(16)}`
    const block = await rpcCall("eth_getBlockByNumber", [blockHex, true])

    if (block && block.transactions) {
      for (const tx of block.transactions) {
        if (collected >= limit) break

        // Check if transaction involves the address
        if (tx.from.toLowerCase() === address.toLowerCase() || tx.to?.toLowerCase() === address.toLowerCase()) {
          const receipt = await rpcCall("eth_getTransactionReceipt", [tx.hash])

          transactions.push({
            hash: tx.hash,
            blockNumber: tx.blockNumber,
            blockHash: tx.blockHash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            gas: tx.gas,
            gasPrice: tx.gasPrice,
            gasUsed: receipt?.gasUsed || "0x0",
            status: receipt?.status || "0x0",
            timestamp: block.timestamp,
            direction: tx.from.toLowerCase() === address.toLowerCase() ? "out" : "in",
          })
          collected++
        }
      }
    }
  }

  return transactions
}
