'use client'

import React, { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Copy, Github, Menu, Search, X, Twitter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useWallet } from '@/lib/unisat'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import '@/app/globals.css'
import { useTheme } from 'next-themes'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { validateTokenId } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const truncateAddress = (address: string) => {
	return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const Header: React.FC = () => {
	const [searchInput, setSearchInput] = useState('')
	const { address, setAddress, isWalletConnected, setIsWalletConnected } = useWallet()
	const { toast } = useToast()
	const pathname = usePathname()
	const router = useRouter()

	const { data: balanceData, error: balanceError } = useSWR(
		isWalletConnected ? `https://utxo-detective-fractal.twetch.app/balance/${address}?v=1` : null,
		fetcher
	)

	const { setTheme } = useTheme()

	useEffect(() => {
		setTheme('dark')
	}, [setTheme])

	const connectWallet = useCallback(async () => {
		if (typeof window.unisat !== 'undefined') {
			try {
				const accounts = await window.unisat.requestAccounts()
				setIsWalletConnected(true)
				setAddress(accounts[0])
			} catch (error) {
				console.error('Error connecting wallet:', error)
			}
		} else {
			alert('Unisat wallet not detected. Please install the extension.')
		}
	}, [setIsWalletConnected, setAddress])

	const disconnectWallet = useCallback(() => {
		setIsWalletConnected(false)
		setAddress('')
	}, [setIsWalletConnected, setAddress])

	const copyAddress = () => {
		navigator.clipboard.writeText(address).then(() => {
			toast({
				title: 'Address Copied!',
				description: 'Your wallet address has been copied to clipboard'
			})
		})
	}

	const formatBalance = (satoshis: number) => {
		return (satoshis / 1e8).toFixed(2)
	}

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()

		const trimmedInput = searchInput.trim()

		if (validateTokenId(trimmedInput)) {
			router.push(`/token/${trimmedInput}`)
			setSearchInput('')
		} else {
			toast({
				title: 'Invalid Token ID',
				description: 'Please enter a valid token ID',
				variant: 'destructive'
			})
		}
	}

	const [isSheetOpen, setIsSheetOpen] = useState(false)

	return (
		<>
			<div className="h-16"></div>
			<header className="h-16 bg-black border-b border-[hsl(var(--border))] flex items-center justify-between px-4 sm:px-8 fixed top-0 w-[100vw] z-50">
				<div className="flex items-center gap-4 sm:gap-8">
					<Link href="/">
						<img src="/logo.svg" alt="Logo" width={84} height={30} />
					</Link>
					<Tabs value={pathname === '/docs' ? '/docs' : '/'} className="hidden sm:block">
						<TabsList>
							<TabsTrigger value="/" asChild>
								<Link href="/" className="hover:text-white transition-colors duration-200">
									Explore
								</Link>
							</TabsTrigger>
							<TabsTrigger value="/docs" asChild>
								<Link href="/docs" className="hover:text-white transition-colors duration-200">
									Docs
								</Link>
							</TabsTrigger>
						</TabsList>
					</Tabs>
					<div className="flex items-center gap-4">
						{' '}
						{/* Changed back from gap-4 to gap-2 */}
						<a
							href="https://github.com/open-fractal/flur"
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-600 hover:text-white transition-all ease-in-out duration-300 transform hover:scale-110"
						>
							<Github size={16} />
						</a>
						<a
							href="https://x.com/Flur69"
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-600 hover:text-white transition-all ease-in-out duration-300 transform hover:scale-110"
						>
							<Twitter size={16} />
						</a>
					</div>
				</div>
				<div className="hidden sm:flex items-center gap-4">
					<form onSubmit={handleSearch} className="relative">
						<Input
							type="text"
							placeholder="Search contracts..."
							value={searchInput}
							onChange={e => setSearchInput(e.target.value)}
							className="w-[200px] pl-8"
						/>
						<div className="absolute left-2 top-1/2 transform -translate-y-1/2">
							<Search className="h-4 w-4 text-muted-foreground" />
						</div>
					</form>
					{isWalletConnected ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									{truncateAddress(address)}
									{balanceData && !balanceError && (
										<span className="ml-2">({formatBalance(balanceData.satoshis)} FB)</span>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem onClick={copyAddress}>
									<Copy className="mr-2 h-4 w-4" />
									Copy Address
								</DropdownMenuItem>
								<DropdownMenuItem onClick={disconnectWallet}>Disconnect Wallet</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button onClick={connectWallet} className="transition-ease-in-out">
							Connect Wallet
						</Button>
					)}
				</div>
				<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" className="sm:hidden">
							<Menu className="h-6 w-6" />
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-[300px] sm:w-[400px]">
						<div className="flex flex-col gap-4">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsSheetOpen(false)}
								className="self-end"
							>
								<X className="h-6 w-6" />
							</Button>
							<Tabs value={pathname === '/docs' ? '/docs' : '/'} className="flex justify-center">
								<TabsList>
									<TabsTrigger value="/" asChild>
										<Link href="/" onClick={() => setIsSheetOpen(false)}>
											Explore
										</Link>
									</TabsTrigger>
									<TabsTrigger value="/docs" asChild>
										<Link href="/docs" onClick={() => setIsSheetOpen(false)}>
											Docs
										</Link>
									</TabsTrigger>
								</TabsList>
							</Tabs>
							<form onSubmit={handleSearch} className="relative">
								<Input
									type="text"
									placeholder="Search contracts..."
									value={searchInput}
									onChange={e => setSearchInput(e.target.value)}
									className="w-full pl-8"
								/>
								<div className="absolute left-2 top-1/2 transform -translate-y-1/2">
									<Search className="h-4 w-4 text-muted-foreground" />
								</div>
							</form>
							<a
								href="https://github.com/open-fractal/flur"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
							>
								<Github size={16} />
								GitHub
							</a>
							{isWalletConnected ? (
								<div className="flex flex-col gap-2">
									<Button variant="outline" onClick={copyAddress}>
										<Copy className="mr-2 h-4 w-4" />
										Copy Address: {truncateAddress(address)}
									</Button>
									{balanceData && !balanceError && (
										<div className="text-center">
											Balance: {formatBalance(balanceData.satoshis)} FB
										</div>
									)}
									<Button onClick={disconnectWallet}>Disconnect Wallet</Button>
								</div>
							) : (
								<Button onClick={connectWallet}>Connect Wallet</Button>
							)}
						</div>
					</SheetContent>
				</Sheet>
			</header>
		</>
	)
}

export default Header
