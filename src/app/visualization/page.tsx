"use client"

import { ethers } from "ethers"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { supabase } from "@/supabase"
import moment from "moment"

const Visualization = () => {
    const router = useRouter()
    const [tokenData, setTokenData] = useState<any>({ list: [], length: Number })
    const [tokenAddress, setTokenAddress] = useState("")
    const [symbol1, setSymbol1] = useState(null)
    const [symbol2, setSymbol2] = useState(null)
    const [pageNum, setPageNum] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [loading, setLoading] = useState(false)

    const ERC20_ABI = [
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)",
    ];

    const getSymbolFromPair = async (pairAddress: string) => {
        try {
            // ABI for Uniswap V2 Pair
            const PAIR_ABI = [
                "function token0() external view returns (address)",
                "function token1() external view returns (address)",
            ];

            // Create provider with Infura URL
            const provider = new ethers.JsonRpcProvider(
                `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_MAINNET_KEY}`
            );

            // Create contract instance for the pair
            const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);

            // Get token0 and token1 addresses
            const [token0Address, token1Address] = await Promise.all([
                pairContract.token0(),
                pairContract.token1(),
            ]);

            // Create contract instances for both tokens
            const token0Contract = new ethers.Contract(
                token0Address,
                ERC20_ABI,
                provider
            );
            const token1Contract = new ethers.Contract(
                token1Address,
                ERC20_ABI,
                provider
            );

            // Get symbols for both tokens
            const [symbol0, symbol1] = await Promise.all([
                token0Contract.symbol(),
                token1Contract.symbol(),
            ]);

            return {
                token0: {
                    address: token0Address,
                    symbol: symbol0,
                },
                token1: {
                    address: token1Address,
                    symbol: symbol1,
                },
            };
        } catch (error) {
            console.error("Error getting pair symbols:", error);
            throw error;
        }
    };

    const getSymbol = async (pairAddress: string) => {
        try {

            if (!pairAddress) {
                throw new Error(`Pair address is required`)
            }

            if (!process.env.NEXT_PUBLIC_MAINNET_KEY) {
                throw new Error("MAINNET_KEY environment variable is not set");
            }

            const pairInfo = await getSymbolFromPair(pairAddress);

            return {
                success: true,
                data: {
                    pairInfo,
                    tradingViewSymbol: `${pairInfo.token0.symbol}${pairInfo.token1.symbol}`,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to fetch token symbols",
            };
        }
    };

    const getLogs = async (data: any) => {

        const { pairAddress, pageNum, pageSize } = data;
        try {
            const provider = new ethers.JsonRpcProvider(
                `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_MAINNET_KEY}`
            );

            const BLOCKS_PER_DAY = 7200;
            const BLOCKS_IN_ONE_MONTH = BLOCKS_PER_DAY * 30;
            const latestBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(latestBlock - BLOCKS_IN_ONE_MONTH, 0);

            // First get the token addresses from the pair
            const PAIR_ABI = [
                "function token0() external view returns (address)",
                "function token1() external view returns (address)",
            ];

            const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);

            // Get token addresses
            const [token0Address, token1Address] = await Promise.all([
                pairContract.token0(),
                pairContract.token1(),
            ]);

            // Create token contracts
            const token0Contract = new ethers.Contract(
                token0Address,
                ERC20_ABI,
                provider
            );
            const token1Contract = new ethers.Contract(
                token1Address,
                ERC20_ABI,
                provider
            );

            // Get decimals for both tokens
            const [decimals0, decimals1] = await Promise.all([
                token0Contract.decimals(),
                token1Contract.decimals(),
            ]);

            let logs = [];
            try {
                logs = await provider.getLogs({
                    address: pairAddress,
                    topics: [
                        ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)"),
                    ],
                    fromBlock: fromBlock,
                    toBlock: "latest",
                });
            } catch (e: any) {
                logs = await provider.getLogs({
                    address: pairAddress,
                    topics: [
                        ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)"),
                    ],
                    fromBlock: e?.error?.data?.from,
                    toBlock: e?.error?.data?.to,
                });
            }
            // Fetch real-time ETH/USD price
            async function fetchETHUSDPrice() {
                const response = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
                );
                const data = await response.json()
                return data.ethereum.usd;
            }

            const ethUSDPrice = await fetchETHUSDPrice()
            // const ethUSDPrice = 1474.26;

            logs.reverse();
            const result = [];

            for (
                let i = (pageNum - 1) * pageSize;
                i < (pageNum * pageSize < logs.length ? pageNum * pageSize : logs.length);
                i++
            ) {
                // Decode data field (amounts)
                const abiCoder = new ethers.AbiCoder();
                const [amount0In, amount1In, amount0Out, amount1Out] = abiCoder.decode(
                    ["uint256", "uint256", "uint256", "uint256"],
                    logs[i].data
                );

                // Decode topics (addresses)
                const sender = `0x${logs[i].topics[1].slice(26)}`;
                const to = `0x${logs[i].topics[2].slice(26)}`;

                // Token details
                const DECIMALS_TOKEN1 = Number(decimals0);
                const DECIMALS_TOKEN2 = Number(decimals1);

                // Calculate trade details
                let tradeType,
                    priceUSD = 0,
                    priceETH = 0,
                    totalETH,
                    totalUSD,
                    amountToken1 = 0,
                    amountToken2 = 0;

                if (amount0In > BigInt(0) && amount1Out > BigInt(0)) {
                    // Token2 -> Token1 (sell)
                    tradeType = "sell";
                    priceETH = Number(amount1Out) / Number(amount0In);
                    amountToken1 = Number(amount1Out) / 10 ** DECIMALS_TOKEN1;
                    amountToken2 = Number(amount0In) / 10 ** DECIMALS_TOKEN2;
                } else if (amount1In > BigInt(0) && amount0Out > BigInt(0)) {
                    // Token1 -> Token2 (buy)
                    tradeType = "buy";
                    priceETH = Number(amount1In) / Number(amount0Out);
                    amountToken1 = Number(amount1In) / 10 ** DECIMALS_TOKEN1;
                    amountToken2 = Number(amount0Out) / 10 ** DECIMALS_TOKEN2;
                }

                // Calculate totals
                totalETH = priceETH * amountToken2;
                totalUSD = totalETH * ethUSDPrice;

                // Fetch block timestamp for datetime (requires provider)
                const getBlockTimestamp = async (blockNumber: number) => {
                    const provider = new ethers.JsonRpcProvider(
                        `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_MAINNET_KEY}`
                    );
                    const block = await provider.getBlock(blockNumber) as any;
                    return new Date(block.timestamp * 1000).toISOString();
                }

                const datetime = await getBlockTimestamp(logs[i].blockNumber);
                priceUSD = priceETH * ethUSDPrice;

                const transaction = await axios.post(
                    `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
                    {
                        method: "eth_getTransactionByHash",
                        params: [logs[i].transactionHash],
                    }
                );

                let rate = amountToken1.toString().split(".")[0].length - 1;

                const maker = transaction?.data?.result?.from;
                // mainTokenAddress : token0Address.toLowerCase()
                // poolAddress : pairAddress.toLowerCase()

                const { data: token } = await supabase
                    .from("pool")
                    .select("*")
                    .eq("mainTokenAddress", token0Address.toLowerCase())
                    .eq("poolAddress", pairAddress.toLowerCase())

                result.push({
                    datetime,
                    tradeType,
                    priceUSD: (priceUSD * 10 ** -rate).toFixed(18),
                    priceETH: (priceETH * 10 ** -rate).toFixed(18),
                    totalETH: totalETH.toFixed(18), // Total in ETH
                    totalUSD: totalUSD.toFixed(18), // Total in USD
                    amountToken2: (amountToken1 * 10 ** -rate).toFixed(18),
                    amountToken1: (amountToken2 * 10 ** rate).toFixed(18),
                    maker,
                    sender,
                    to,
                    hash: logs[i].blockHash,
                    transactionHash: logs[i].transactionHash,
                    name:
                        token[0]?.deployers[0] == maker
                            ? token[0]?.firstTokenName
                            : token[0]?.deployers[1] == maker
                                ? token[0]?.nextTokenName
                                : "",
                });
            }

            return { list: result, total: logs.length };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to fetch logs",
            };
        }
    };


    const onSearch = async (pageNum: Number, pageSize: Number) => {
        setLoading(true)
        const response = await getSymbol(tokenAddress)
        if (response.success) {
            const pairInfo = response.data
            setSymbol1(pairInfo?.pairInfo.token0.symbol)
            setSymbol2(pairInfo?.pairInfo.token1.symbol)
            const temp = {
                pairAddress: tokenAddress,
                pageNum: pageNum,
                pageSize: pageSize
            }
            const data = await getLogs(temp)
            setTokenData(data)
        }
        setLoading(false)
    }

    return (
        <div className="w-full p-8 flex flex-col gap-3">
            <div
                onClick={() => router.push('/')}
                className="w-max px-12 h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
            >Back</div>
            <div className="w-[700px] p-8 flex gap-8">
                <input
                    value={tokenAddress}
                    onChange={(e: any) => setTokenAddress(e?.target?.value)}
                    placeholder="Token Address"
                    className="w-[500px] py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
                />
                <button
                    onClick={() => onSearch(1, pageSize)}
                    className="w-[180px] bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >Search</button>
            </div>
            <div className="w-full mb-[20px] h-[500px] ">
                <div className="flex space-between mb-[10px]">
                    {
                        tokenAddress == "" ? <h3>No Graph</h3> : <h3>Price Chart - {symbol1}/{symbol2 || "Loading..."}</h3>
                    }
                </div>
                <div className="w-full h-full">
                    {tokenAddress ? (
                        <iframe
                            id="dextools-widget"
                            title="DEXTools Trading Chart"
                            width="100%"
                            height="100%"
                            src={`https://www.dextools.io/widget-chart/en/ether/pe-light/${tokenAddress}?theme=light&chartType=2&chartResolution=30&drawingToolbars=false`}
                        />
                    ) : (
                        <></>
                    )}
                </div>
            </div>
            <div className="w-full overflow-x-auto justify-center flex flex-col gap-4 items-center">
                <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">index</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Price ETH</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Amount FJO</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Amount WETH</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Maker</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tokenData.list.length > 0 && loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    {loading ? "Loading..." : ""}
                                </td>
                            </tr>) :
                            tokenData.list.map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{moment(item.datetime).format('YYYY-MM-DD HH:mm:ss')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tradeType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.priceUSD}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalUSD}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.priceETH}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.amountToken1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.amountToken2}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.maker}</td>
                                </tr>
                            ))}
                        {tokenData.list.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    {loading ? "Loading..." : "No pools found"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="w-[130px] h-[45px] flex justify-between gap-5">
                    <div
                        onClick={() => {
                            if (pageNum > 1) {
                                setPageNum(pageNum - 1)
                                onSearch(pageNum - 1, pageSize)
                            }
                        }}
                        className={`w-[45px] px-12 h-8 ${(pageNum == 1) ? "bg-[#efefef] cursor-not-allowed" : "bg-white hover:bg-gray-50 shadow-lg cursor-pointer"} rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all`}
                    >{`<`}</div>
                    <div className="text-2xl font-semibold">{pageNum}</div>
                    <div
                        onClick={() => {
                            if (pageNum < 20) {
                                setPageNum(pageNum + 1)
                                onSearch(pageNum + 1, pageSize)
                            }
                        }}
                        className={`w-[45px] px-12 h-8 ${(pageNum == 20) ? "bg-[#efefef] cursor-not-allowed" : "bg-white hover:bg-gray-50 shadow-lg cursor-pointer"} rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all`}
                    >{`>`}</div>
                </div>
            </div>
            <div className="w-full"></div>
        </div>
    )

}

export default Visualization