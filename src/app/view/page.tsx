'use client'

import { supabase } from "@/supabase"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const View = () => {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTokenData = async () => {
    setLoading(true)
    const { data: tokenData } = await supabase.from("pool").select("*")
    if (tokenData) {
      setData(tokenData)
    }
    setLoading(false)
  }

  const onEdit = (id: number) => {
    router.push('/view/' + id + '/edit')
  }

  const onView = (id: number) => {
    router.push('/view/' + id)
  }

  const getTokenName = (index: number, deployer: string[], mainTokenName: string, poolCreatedTime: string) => {
    let date = poolCreatedTime.split(" ")[0]
    if (deployer[0] && deployer[1]) {
      return "Thief - " + mainTokenName + " - " + date + " - " + (index + 1)
    } else {
      if (deployer[index]) {
        return "Thief - " + mainTokenName + " - " + date
      } else {
        return ""
      }
    }
  }

  const onDelete = async (id: number) => {
    const { error } = await supabase
      .from('pool')
      .delete()
      .eq("id", id)
    if (error) {
      console.log(error)
    } else {
      await fetchTokenData()
    }
  }

  useEffect(() => {
    fetchTokenData()
  }, [])

  return (
    <div className="w-full p-8 flex flex-col gap-8">
      <div className="w-[140px] flex w-full justify-between">
        <div
          onClick={() => router.push('/home')}
          className="w-max px-12 h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
        >Back</div>
        <div
          onClick={() => router.push('/view/create')}
          className="w-max px-12 h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
        >Create</div>
      </div>
      <div className="w-full flex items-center justify-center">
        <p className="text-semibold text-2xl">There are {data?.length} thieves in the database</p>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Index</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Pool Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Pool Address</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Wallet First Transaction</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Wallet Next Transaction</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Name - Wallet First Transaction</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Name - Wallet Next Transaction</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((pool, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pool?.mainTokenName + " (" + pool?.mainTokenSymbol + ")"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="font-mono">{pool?.poolCreatedTime}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pool?.poolAddress}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pool?.deployers[0]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pool?.deployers[1]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pool?.firstTokenName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pool?.nextTokenName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 gap-4 flex">
                  <button
                    onClick={() => onEdit(pool?.id)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onView(pool?.id)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onDelete(pool?.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {loading ? "Loading..." : "No pools found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default View