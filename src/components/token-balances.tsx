'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { useWallet } from '@/lib/unisat'
import { API_URL } from '@/lib/constants'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface BalanceResponse {
	code: number
	msg: string
	data: {
		balances: Array<{
			tokenId: string
			confirmed: string
		}>
		trackerBlockHeight: number
	}
}

interface TokenInfo {
	symbol: string
	decimals: number
}

const truncateTokenId = (tokenId: string | undefined) => {
	if (!tokenId) return 'Unknown'
	return `${tokenId.slice(0, 4)}...${tokenId.slice(-4)}`
}

export function TokenBalances() {
	const router = useRouter()
	const { address } = useWallet()
	const [tokenInfo, setTokenInfo] = useState<Map<string, TokenInfo>>(new Map())
	const [isOpen, setIsOpen] = useState(false)

	const { data: balanceResponse, error: balanceError } = useSWR<BalanceResponse>(
		address ? `${API_URL}/api/addresses/${address}/balances?v=1` : null,
		fetcher
	)

	useEffect(() => {
		if (balanceResponse?.data?.balances) {
			fetchTokenInfo(balanceResponse.data.balances.map(b => b.tokenId))
		}
	}, [balanceResponse])

	const fetchTokenInfo = async (tokenIds: string[]) => {
		const newTokenInfo = new Map<string, TokenInfo>()
		await Promise.all(
			tokenIds.map(async tokenId => {
				try {
					const response = await fetch(`${API_URL}/api/tokens/${tokenId}?v=1`)
					const data = await response.json()
					if (data.code === 0 && data.data) {
						newTokenInfo.set(tokenId, {
							symbol: data.data.symbol,
							decimals: data.data.decimals
						})
					}
				} catch (error) {
					console.error(`Error fetching token info for ${tokenId}:`, error)
				}
			})
		)
		setTokenInfo(newTokenInfo)
	}

	if (!address) return null
	if (balanceError) return <p>Error loading token balances: {balanceError.message}</p>
	if (!balanceResponse) return <TokenBalancesSkeleton />
	if (!balanceResponse.data) return <p>Invalid response format from the server.</p>
	if (!Array.isArray(balanceResponse.data.balances)) return <p>Invalid balances data received.</p>

	const balances = balanceResponse.data.balances
	const tokenCount = balances.length

	const formatBalance = (balance: string, decimals: number) => {
		const balanceNum = parseInt(balance)
		const scaledBalance = balanceNum / Math.pow(10, decimals)
		return scaledBalance.toLocaleString('en-US', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals
		})
	}

	const handleRowClick = (tokenId: string) => {
		router.push(`/token/${tokenId}`)
	}

	return (
		<Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
			<Card className={`w-full mt-8 ${isOpen ? 'mb-8' : 'mb-4'} rounded-md`}>
				<CardHeader className="py-3">
					<div className="flex justify-between items-center">
						<CardTitle>
							Token Balances ({tokenCount})
						</CardTitle>
						<Collapsible.Trigger asChild>
							<button className="p-2 hover:bg-muted rounded transition-colors">
								{isOpen ? (
									<ChevronUp size={24} className="text-primary" />
								) : (
									<ChevronDown size={24} className="text-primary" />
								)}
							</button>
						</Collapsible.Trigger>
					</div>
				</CardHeader>
				<Collapsible.Content>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							Tracker Block Height: {balanceResponse?.data.trackerBlockHeight || 'Unknown'}
						</p>
						{tokenCount === 0 ? (
							<p>No token balances found.</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Token ID</TableHead>
										<TableHead>Symbol</TableHead>
										<TableHead className="text-right">Balance</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{balances.map(balance => {
										const token = tokenInfo.get(balance.tokenId)
										const formattedBalance = token
											? formatBalance(balance.confirmed, token.decimals)
											: balance.confirmed
										return (
											<TableRow
												key={balance.tokenId}
												onClick={() => handleRowClick(balance.tokenId)}
												className="cursor-pointer hover:bg-muted/50 duration-200"
											>
												<TableCell className="font-mono">{truncateTokenId(balance.tokenId)}</TableCell>
												<TableCell>{token?.symbol || 'Loading...'}</TableCell>
												<TableCell className="text-right">{formattedBalance}</TableCell>
											</TableRow>
										)
									})}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Collapsible.Content>
			</Card>
		</Collapsible.Root>
	)
}

function TokenBalancesSkeleton() {
	return (
		<Card className="w-full">
			<CardHeader>
				<Skeleton className="h-7 w-[200px]" />
				<Skeleton className="h-4 w-[250px] mt-1" />
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<div className="flex justify-between">
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
					</div>
					<div className="flex justify-between">
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
					</div>
					<div className="flex justify-between">
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
