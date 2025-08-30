"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Blocks as Block,
  Receipt,
  Clock,
  RefreshCw,
  Copy,
  User,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BlockData {
  number: string
  hash: string
  timestamp: string
  transactions: string[]
  gasUsed: string
  gasLimit: string
  miner?: string
  parentHash?: string
}

interface TransactionData {
  hash: string
  blockNumber: string
  from: string
  to: string
  value: string
  gasUsed: string
  status: string
  gasPrice?: string
  direction?: string
}

interface AddressData {
  address: string
  balance: string
  nonce: string
  isContract: boolean
  code?: string
}

export function ExplorerSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any>(null)
  const [recentBlocks, setRecentBlocks] = useState<BlockData[]>([])
  const [recentTransactions, setRecentTransactions] = useState<TransactionData[]>([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadRecentBlocks()
    loadRecentTransactions()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a block number, transaction hash, or address",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch("/api/explorer/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setSearchResult(data)
        toast({
          title: "Search completed",
          description: `Found ${data.type}: ${data.result?.hash || data.result?.number || searchQuery}`,
        })
      } else {
        toast({
          title: "Search failed",
          description: data.error || "No results found for your search query",
          variant: "destructive",
        })
        setSearchResult(null)
      }
    } catch (error) {
      toast({
        title: "Search error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      })
      setSearchResult(null)
    } finally {
      setIsSearching(false)
    }
  }

  const loadRecentBlocks = async () => {
    setIsLoadingRecent(true)
    try {
      const response = await fetch("/api/explorer/search?type=blocks&limit=10")
      const data = await response.json()

      if (response.ok && data.data) {
        setRecentBlocks(data.data)
      }
    } catch (error) {
      console.error("Failed to load recent blocks:", error)
    } finally {
      setIsLoadingRecent(false)
    }
  }

  const loadRecentTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      const response = await fetch("/api/explorer/search?type=transactions&limit=15")
      const data = await response.json()

      if (response.ok && data.data) {
        setRecentTransactions(data.data)
      }
    } catch (error) {
      console.error("Failed to load recent transactions:", error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const loadAddressTransactions = async (address: string) => {
    try {
      const response = await fetch(`/api/explorer/search?type=address-transactions&address=${address}&limit=20`)
      const data = await response.json()

      if (response.ok && data.data) {
        return data.data
      }
    } catch (error) {
      console.error("Failed to load address transactions:", error)
    }
    return []
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    })
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(Number.parseInt(timestamp) * 1000)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200/50 dark:border-purple-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Search className="w-5 h-5" />
            Blockchain Explorer
          </CardTitle>
          <CardDescription>Search for blocks, transactions, and addresses on Somnia Testnet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter block number, transaction hash, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="font-mono"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="bg-purple-600 hover:bg-purple-700">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResult && (
            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {searchResult.type === "block" ? (
                    <Block className="w-4 h-4" />
                  ) : searchResult.type === "transaction" ? (
                    <Receipt className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  {searchResult.type === "block"
                    ? "Block"
                    : searchResult.type === "transaction"
                      ? "Transaction"
                      : "Address"}{" "}
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {searchResult.type === "block" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Block Number</p>
                        <p className="font-mono">{searchResult.result.number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                        <p className="font-mono">
                          {new Date(Number.parseInt(searchResult.result.timestamp) * 1000).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                        <p className="font-mono">{searchResult.result.transactions.length}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gas Used</p>
                        <p className="font-mono">{Number.parseInt(searchResult.result.gasUsed).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Block Hash</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm break-all flex-1">{searchResult.result.hash}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(searchResult.result.hash, "Block hash")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : searchResult.type === "transaction" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant={searchResult.result.status === "0x1" ? "default" : "destructive"}>
                          {searchResult.result.status === "0x1" ? "Success" : "Failed"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Block Number</p>
                        <p className="font-mono">{Number.parseInt(searchResult.result.blockNumber)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Value</p>
                        <p className="font-mono">
                          {(Number.parseInt(searchResult.result.value) / 1e18).toFixed(4)} STT
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gas Used</p>
                        <p className="font-mono">{Number.parseInt(searchResult.result.gasUsed).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">From</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm break-all flex-1">{searchResult.result.from}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(searchResult.result.from, "From address")}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">To</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm break-all flex-1">{searchResult.result.to}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(searchResult.result.to, "To address")}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm break-all flex-1">{searchResult.result.hash}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(searchResult.result.hash, "Transaction hash")}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Balance</p>
                        <p className="font-mono">
                          {(Number.parseInt(searchResult.result.balance) / 1e18).toFixed(4)} STT
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Transaction Count</p>
                        <p className="font-mono">{searchResult.result.nonce}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <Badge variant={searchResult.result.isContract ? "secondary" : "default"}>
                          {searchResult.result.isContract ? "Contract" : "Wallet"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm break-all flex-1">{searchResult.result.address}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(searchResult.result.address, "Address")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <AddressTransactions address={searchResult.result.address} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Tabs defaultValue="blocks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blocks">Recent Blocks</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Block className="w-4 h-4" />
                  Latest Blocks
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadRecentBlocks} disabled={isLoadingRecent}>
                  <RefreshCw className={`w-4 h-4 ${isLoadingRecent ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentBlocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Block</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Txns</TableHead>
                        <TableHead>Gas Used</TableHead>
                        <TableHead>Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentBlocks.map((block) => (
                        <TableRow key={block.hash}>
                          <TableCell>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-mono text-blue-600"
                              onClick={() => setSearchQuery(block.number)}
                            >
                              {block.number}
                            </Button>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(block.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{block.transactions.length}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {Number.parseInt(block.gasUsed).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{formatHash(block.hash)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(block.hash, "Block hash")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Block className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent blocks available</p>
                  <p className="text-sm">Block data will appear here once the network is active</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Latest Transactions
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadRecentTransactions} disabled={isLoadingTransactions}>
                  <RefreshCw className={`w-4 h-4 ${isLoadingTransactions ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hash</TableHead>
                        <TableHead>Block</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((tx) => (
                        <TableRow key={tx.hash}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="link"
                                className="p-0 h-auto font-mono text-blue-600 text-sm"
                                onClick={() => setSearchQuery(tx.hash)}
                              >
                                {formatHash(tx.hash)}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(tx.hash, "Transaction hash")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-mono text-blue-600"
                              onClick={() => setSearchQuery(Number.parseInt(tx.blockNumber).toString())}
                            >
                              {Number.parseInt(tx.blockNumber)}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-mono text-sm"
                              onClick={() => setSearchQuery(tx.from)}
                            >
                              {formatAddress(tx.from)}
                            </Button>
                          </TableCell>
                          <TableCell>
                            {tx.to ? (
                              <Button
                                variant="link"
                                className="p-0 h-auto font-mono text-sm"
                                onClick={() => setSearchQuery(tx.to)}
                              >
                                {formatAddress(tx.to)}
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">Contract Creation</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {(Number.parseInt(tx.value) / 1e18).toFixed(4)} STT
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.status === "0x1" ? "default" : "destructive"}>
                              {tx.status === "0x1" ? "Success" : "Failed"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent transactions available</p>
                  <p className="text-sm">Transaction data will appear here once the network is active</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Block className="w-5 h-5 text-blue-500" />
            Network Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {recentBlocks.length > 0 ? recentBlocks[0].number : "---"}
              </p>
              <p className="text-sm text-muted-foreground">Latest Block</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {recentBlocks.reduce((sum, block) => sum + block.transactions.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {recentBlocks.length > 0 ? formatTime(recentBlocks[0].timestamp) : "---"}
              </p>
              <p className="text-sm text-muted-foreground">Last Block</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">50312</p>
              <p className="text-sm text-muted-foreground">Chain ID</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AddressTransactions({ address }: { address: string }) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTransactions()
  }, [address])

  const loadTransactions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/explorer/search?type=address-transactions&address=${address}&limit=10`)
      const data = await response.json()

      if (response.ok && data.data) {
        setTransactions(data.data)
      }
    } catch (error) {
      console.error("Failed to load address transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    })
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Recent Transactions</h4>
        <Button variant="outline" size="sm" onClick={loadTransactions} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.hash} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {tx.direction === "out" ? (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium">{tx.direction === "out" ? "Sent" : "Received"}</span>
                </div>
                <div className="font-mono text-sm">{formatHash(tx.hash)}</div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(tx.hash, "Transaction hash")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{(Number.parseInt(tx.value) / 1e18).toFixed(4)} STT</div>
                <Badge variant={tx.status === "0x1" ? "default" : "destructive"} className="text-xs">
                  {tx.status === "0x1" ? "Success" : "Failed"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No transactions found for this address</p>
        </div>
      )}
    </div>
  )
}
