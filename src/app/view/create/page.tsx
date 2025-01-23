"use client"

import { supabase } from "@/supabase"
import { useRouter } from "next/navigation"
import { useState } from "react"

const Create = () => {
  const router = useRouter()
  const [mainTokenName, setMainTokenName] = useState("")
  const [mainTokenSymbol, setMainTokenSymbol] = useState("")
  const [holdersDisplay, setHoldersDisplay] = useState(0)
  const [liquidity, setLiquidity] = useState("")
  const [formattedLiquidity, setFormattedLiquidity] = useState("")
  const [sideTokenSymbol, setSideTokenSymbol] = useState("")
  const [poolCreatedTime, setPoolCreatedTime] = useState("")
  const [mainTokenAddress, setMainTokenAddress] = useState("")
  const [poolAddress, setPoolAddress] = useState("")
  const [deployers, setDeployers] = useState(["", ""])

  const onCreate = async () => {
    const { error } = await supabase
      .from("pool")
      .insert({
        added_at: new Date(),
        mainTokenName: mainTokenName,
        mainTokenSymbol: mainTokenSymbol,
        holdersDisplay: holdersDisplay,
        liquidity: liquidity,
        formattedLiquidity: formattedLiquidity,
        sideTokenSymbol: sideTokenSymbol,
        poolCreatedTime: poolCreatedTime,
        mainTokenAddress: mainTokenAddress,
        poolAddress: poolAddress,
        deployers: deployers
      })


    if (error) {
      console.log(error)
    } else {
      console.log("this data added successfully")
      router.push('/view')
    }
  }

  return (
    <div className="w-full p-8 flex flex-col gap-8">
      <div className="w-[140px] flex w-full justify-between">
        <div
          onClick={() => router.push('/view')}
          className="w-max px-12 h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
        >Back</div>
        <div
          onClick={() => onCreate()}
          className="w-max px-12 h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
        >Save</div>
      </div>
      <div className="mb-5 transition-all relative rounded-2xl shadow-2xl w-full p-5 mb-4 flex flex-col w-full border-[#ddd] border-[1px]">
        <div className="flex justify-between items-center w-full">
          <div className="flex justify-between mb-4 pb-3 border-b-[1px] border-b-[#eee] pr-[120px] w-full">
            <div className="flex gap-2">
              <h3 className="text-xl font-bold text-[#2c3e50]">
                <input
                  value={mainTokenName}
                  onChange={(e: any) => setMainTokenName(e?.target?.value)}
                  placeholder="Main Token Name"
                  className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
                />&nbsp;
                {`(`}<input
                  value={mainTokenSymbol}
                  onChange={(e: any) => setMainTokenSymbol(e?.target?.value)}
                  placeholder="Main Token Symbol"
                  className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
                />{`)`}
              </h3>
              <p className="bg-[#17a2b8] py-[2px] px-[6px] rounded-md ml-2 text-md font-bold text-white">
                <input
                  type="number"
                  value={holdersDisplay}
                  onChange={(e: any) => setHoldersDisplay(e?.target?.value)}
                  className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
                />&nbsp;
                holders</p>
            </div>
            <div className="token-links">
              {/* <a href={dextoolsUrl} target="_blank" className="token-link">Voir sur DexTools</a> */}
            </div>
          </div>
        </div>
        <div className="token-info">
          <div className="info-item">
            <div className="info-label">Liquidité</div>
            <div className="info-value liquidity-value">
              <input
                placeholder="Liquidity"
                value={liquidity}
                onChange={(e: any) => setLiquidity(e?.target?.value)}
                className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
              />
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Exchange</div>
            <div className="info-value"><input
              placeholder="Formatted Liquidity"
              value={formattedLiquidity}
              onChange={(e: any) => setFormattedLiquidity(e?.target?.value)}
              className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
            />
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Paire</div>
            <div className="info-value">
              {mainTokenSymbol} / <input
                placeholder="Side Token Symbol"
                value={sideTokenSymbol}
                onChange={(e: any) => setSideTokenSymbol(e?.target?.value)}
                className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
              />
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Date de création</div>
            <div className="info-value"><input
              placeholder="Pool Created Time"
              value={poolCreatedTime}
              onChange={(e: any) => setPoolCreatedTime(e?.target?.value)}
              className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
            />
            </div>
          </div>
        </div>
        <div className="token-info mt-[15px]">
          <div className="info-item">
            <div className="info-label">Adresse du Token</div>
            <div className="info-value address"><input
              placeholder="Main Token Address"
              value={mainTokenAddress}
              onChange={(e: any) => setMainTokenAddress(e?.target?.value)}
              className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
            />
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Adresse du Pool</div>
            <div className="info-value address"><input
              placeholder="Pool Address"
              value={poolAddress}
              onChange={(e: any) => setPoolAddress(e?.target?.value)}
              className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
            />
            </div>
          </div>
        </div>
        <div className="transaction-info mt-[15px]">
          <div className="info-item">
            <div className="info-label">Wallet First Transaction</div>
            <div className="info-value address"><input
              placeholder="Wallet First Transaction"
              value={deployers[0]}
              onChange={(e: any) => setDeployers([e?.target?.value, deployers[1]])}
              className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
            />
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Wallet Next Transaction</div>
            <div className="info-value address"><input
              placeholder="Next Token Address"
              value={deployers[1]}
              onChange={(e: any) => setDeployers([deployers[0], e?.target?.value])}
              className="py-1 px-2 text-black transition-all border-zinc-500 focus:border-zinc-700 border-[1px] rounded-md outline-none focus:outline-none"
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Create