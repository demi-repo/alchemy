"use client"

import TokenCard from "@/components/tokenCard/TokenCard"
import { supabase } from "@/supabase"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const TokenDetail = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [id, setId] = useState<any>(null)
  const [tokenData, setTokenData] = useState<any>(null)
  const [nameFirstTransaction, setNameFirstTransaction] = useState("")
  const [nameNextTransaction, setNameNextTransaction] = useState("")

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("pool")
      .select("*")
      .eq("id", id)
      .single()
    if (error) {
      console.log(error)
    } else if (data) {
      setNameFirstTransaction(data?.firstTokenName)
      setNameNextTransaction(data?.nextTokenName)
      setTokenData({ ...data, alreadyExist: false })
    }
  }

  const onSave = async () => {
    if (id) {
      const { error } = await supabase
        .from('pool')
        .update({
          firstTokenName: nameFirstTransaction,
          nextTokenName: nameNextTransaction
        })
        .eq("id", id)

      if (error) console.log(error)
      else router.push('/view')
    }
  }

  useEffect(() => {
    let param = pathname?.match(/\/view\/(.+)/)?.[1]
    if (param) {
      let id = parseInt(param)
      setId(id)
    }
  }, [])

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  return (
    <div className="w-full p-8 flex flex-col gap-8">
      <div className="w-[140px] flex w-full justify-between">
        <div
          onClick={() => router.push('/view')}
          className="w-max px-12 h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
        >Back</div>
        <div
          onClick={() => onSave()}
          className="w-max px-12 h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
        >Save</div>
      </div>
      {
        tokenData ?
          <div className="mb-5 transition-all relative rounded-2xl shadow-2xl w-full p-5 mb-4 flex flex-col w-full border-[#ddd] border-[1px]">
            <div className="flex justify-between items-center w-full">
              <div className="flex justify-between mb-4 pb-3 border-b-[1px] border-b-[#eee] pr-[120px] w-full">
                <div className="flex gap-2">
                  <h3 className="text-xl font-bold text-[#2c3e50]">{tokenData?.mainTokenName} ({tokenData?.mainTokenSymbol})</h3>
                  <p className="bg-[#17a2b8] py-[2px] px-[6px] rounded-md ml-2 text-md font-bold text-white">{tokenData?.holdersDisplay} holders</p>
                </div>
                <div className="token-links">
                  <a href={tokenData?.dextoolsUrl} target="_blank" className="token-link">Voir sur DexTools</a>
                </div>
              </div>
            </div>
            <div className="token-info">
              <div className="info-item">
                <div className="info-label">Liquidité</div>
                <div className="info-value liquidity-value">
                  {tokenData?.liquidity}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Exchange</div>
                <div className="info-value">{tokenData?.formattedLiquidity}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Paire</div>
                <div className="info-value">{tokenData?.mainTokenSymbol} / {tokenData?.sideTokenSymbol}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Date de création</div>
                <div className="info-value">{tokenData?.poolCreatedTime}</div>
              </div>
            </div>
            <div className="token-info mt-[15px]">
              <div className="info-item">
                <div className="info-label">Adresse du Token</div>
                <div className="info-value address">{tokenData?.mainTokenAddress}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Adresse du Pool</div>
                <div className="info-value address">{tokenData?.poolAddress}</div>
              </div>
            </div>
            <div className="transaction-info mt-[15px]">
              <div className="info-item">
                <div className="info-label">Wallet First Transaction</div>
                <div className="info-value address">{tokenData?.deployers[0] || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Wallet Next Transaction</div>
                <div className="info-value address">{tokenData?.deployers[1] || 'N/A'}</div>
              </div>
            </div>
            <div className="transaction-info mt-[15px] w-full">
              <div className="info-item w-full">
                <div className="info-label">Name - Wallet First Transaction</div>
                <div className="info-value address w-full"><input
                  placeholder="First Token Name"
                  value={nameFirstTransaction}
                  onChange={(e: any) => setNameFirstTransaction(e?.target?.value)}
                  className="py-1 px-2 text-black transition-all border-zinc-500 w-full focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
                /></div>

              </div>
              <div className="info-item w-full">
                <div className="info-label">Name - Wallet Next Transaction</div>
                <div className="info-value address w-full"><input
                  placeholder="Next Token Name"
                  value={nameNextTransaction}
                  onChange={(e: any) => setNameNextTransaction(e?.target?.value)}
                  className="py-1 px-2 text-black transition-all border-zinc-500 w-full focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
                /></div>
              </div>
            </div>
          </div> :
          <p>loading...</p>
      }
    </div>
  )
}

export default TokenDetail