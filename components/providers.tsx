"use client"


import '@rainbow-me/rainbowkit/styles.css'
import {
RainbowKitProvider,
getDefaultConfig,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { defineChain } from 'viem'


const queryClient = new QueryClient()


// Definisikan Somnia Testnet
const somnia = defineChain({
id: 50312,
name: "Somnia Testnet",
nativeCurrency: { name: "Somnia Token", symbol: "STT", decimals: 18 },
rpcUrls: {
default: { http: ["https://dream-rpc.somnia.network"] },
},
blockExplorers: {
default: { name: "Somnia Explorer", url: "https://explorer.somnia.network" },
},
})


const config = getDefaultConfig({
appName: 'Somnia Faucet DApp',
projectId: '0e0f865f2e43c787cf6610f5f80fe5f1', // projectId RainbowKit
chains: [somnia],
ssr: true,
})


export function Providers({ children }: { children: React.ReactNode }) {
return (
<WagmiProvider config={config}>
<QueryClientProvider client={queryClient}>
<RainbowKitProvider>
{children}
</RainbowKitProvider>
</QueryClientProvider>
</WagmiProvider>
)
}