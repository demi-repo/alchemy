"use client"

import TokenCard from "@/components/tokenCard/TokenCard"
import { supabase } from "@/supabase"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const TokenDetail = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [tokenData, setTokenData] = useState<any>(null)

  const fetchData = async (id: number) => {
    const { data, error } = await supabase
      .from("pool")
      .select("*")
      .eq("id", id)
      .single()
    if (error) {
      console.log(error)
    } else if (data) {
      setTokenData({ ...data, alreadyExist: false })
    }
  }
  useEffect(() => {
    let param = pathname?.match(/\/view\/(.+)/)?.[1]
    if (param) {
      let id = parseInt(param)
      fetchData(id)
    }
  }, [])

  return (
    <div className="w-full p-8 flex flex-col gap-8">
      <div className="w-[140px] flex">
        <div
          onClick={() => router.push('/view')}
          className="w-full h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
        >Back</div>
      </div>
      {
        tokenData ?
          <TokenCard data={tokenData} type="detail" /> :
          <p>loading...</p>
      }
    </div>
  )
}

export default TokenDetail