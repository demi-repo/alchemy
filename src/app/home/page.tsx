"use client"

import { useEffect, useRef, useState } from "react"
import { confirmDataExist, getDeployerAddresses } from '@/utils/index'
import TokenCard from "@/components/tokenCard/TokenCard"
import { useRouter } from "next/navigation"
import { supabase } from "@/supabase"

const Home = () => {
  const autoSaveRef = useRef(false)
  const [maxCost, setMaxCost] = useState<number>(10)
  const [maxPeriod, setMaxdPeriod] = useState<number>(7)
  const [loading, setLoading] = useState(false)
  const [tokenData, setTokenData] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState<any[]>([])
  const [stop, setStop] = useState(false)
  const errRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [autoSave, setAutoSave] = useState(false)

  const onAddError = async (t: string) => {
    let temp = errorMsg
    let timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    let text = '[' + timestamp + "] " + t
    temp.push(text)
    setErrorMsg([...temp])
    if (errRef?.current) {
      errRef.current.scrollTop = errRef.current.scrollHeight;
    }
  }

  const onAddTokenData = (e: any) => {
    let temp = tokenData
    temp.push(e)
    setTokenData([...temp])
  }

  const makeApiCall = async (url: string) => {
    onAddError(`Appel API vers : ${url}`)
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || '',
          'accept': 'application/json',
          'origin': window.location.origin
        }
      })
      onAddError(`Statut de la réponse : ${response.status}`)

      if (!response.ok) throw new Error(`Erreur HTTP! statut: ${response.status}`)
      const text = await response.text()
      onAddError(`Réponse brute : ${text.substring(0, 200)}...`)

      try {
        const data = JSON.parse(text)
        onAddError(`Réponse parsée avec succès`)
        return data
      } catch (e: any) {
        throw new Error(`Erreur de parsing JSON : ${e?.message}`)
      }
    } catch (error: any) {
      onAddError(`Erreur d'appel API : ${error?.message}`)
      throw error
    }
  }

  const sleep = (ms: any) => {
    return new Promise(resolve => setTimeout(resolve, parseInt(ms)))
  }

  const getLiquidity = async (poolAddress: any, retryCount = 0) => {
    onAddError(`Récupération de la liquidité pour le pool : ${poolAddress} (tentative ${retryCount + 1})`)
    try {
      const data = await makeApiCall(`${process.env.NEXT_PUBLIC_BASE_URL}/v2/pool/ether/${poolAddress}/liquidity`)

      onAddError(`Données de liquidité reçues : ${JSON.stringify(data)}`)
      return data?.data?.liquidity || 0
    } catch (error: any) {
      if (retryCount < 2) {
        onAddError(`Nouvelle tentative après erreur : ${error?.message}`)
        await sleep(process.env.NEXT_PUBLIC_API_RATE_LIMIT)
        return getLiquidity(poolAddress, retryCount + 1)
      }
      throw error
    }
  }

  const stopSearch = async () => {
    if (loading) {
      setStop(true)
      onAddError('Arrêt de la recherche demandé...')
    }
  }

  const getTokenHolders = async (chain: any, address: any, retryCount = 0) => {
    try {
      const data = await makeApiCall(`${process.env.NEXT_PUBLIC_BASE_URL}/v2/token/${chain}/${address}/info`)
      const holders = data?.data?.holders

      onAddError(`Holders trouvés pour ${address}: ${holders}`)

      if (holders === undefined || holders === null) {
        throw new Error('Données de holders non trouvées')
      }
      return holders
    } catch (error: any) {
      onAddError(`Erreur lors de la récupération des holders (tentative ${retryCount + 1}): ${error?.message}`)
      if (retryCount < 2) {
        onAddError(`Nouvelle tentative dans ${process.env.NEXT_PUBLIC_API_RATE_LIMIT}ms...`)
        await sleep(process.env.NEXT_PUBLIC_API_RATE_LIMIT)
        return getTokenHolders(chain, address, retryCount + 1)
      }
      onAddError('Échec de la récupération des holders après plusieurs tentatives')
      return null
    }
  }

  const formatNumber = (num: any) => {
    const value = Number(num)
    if (value === null || isNaN(value) || value === undefined) return '0'

    if (Math.abs(value) < 0.01) {
      const str = value.toString()
      if (str.includes('e-')) {
        const [base, exponent] = str.split('e-')
        const zeroCount = parseInt(exponent) - 1
        const baseNumber = parseFloat(base).toFixed(4)
        return `$0.0${zeroCount}${baseNumber}`
      }
    }
    if (value < 1000) {
      return '$' + value.toFixed(4)
    }
    return '$' + new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value)
  }

  const formatTimeAgo = (date: any) => {
    const now = new Date()
    const creationTime = new Date(date)
    const diffInMilliseconds = now.getTime() - creationTime.getTime()

    const minutes = Math.floor(diffInMilliseconds / (1000 * 60))
    const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60))
    const days = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `créé il y a ${minutes} minutes`
    } else if (hours < 24) {
      return `créé il y a ${hours} heures`
    } else {
      return `créé il y a ${days} jours`
    }
  }

  const getLiquidityClass = (liquidity: any) => {
    const value = Number(liquidity)
    if (value >= 5) return 'liquidity-high'
    if (value >= 1) return 'liquidity-medium'
    return 'liquidity-low'
  }

  const formatLiquidityFriendly = (num: any) => {
    const value = Number(num)
    if (value === null || isNaN(value) || value === undefined) return '0$'
    if (Math.abs(value) < 0.01) {
      return '~0$'
    }
    if (value < 1000) {
      return value.toFixed(2) + '$'
    }
    if (value < 1000000) {
      return (value / 1000).toFixed(1) + 'K$'
    }
    return (value / 1000000).toFixed(1) + 'M$'
  }

  const onSearchToken = async () => {
    if (loading) {
      onAddError("Recherche déjà en cours")
    } else {
      setStop(false)
      setLoading(true)
      const now = new Date()
      const fromDate = new Date(now.getTime() - (maxPeriod * 24 * 60 * 60 * 1000)).toISOString()
      const toDate = now.toISOString()
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${fromDate}&to=${toDate}&page=0&pageSize=50`
      const data = await makeApiCall(url)
      await sleep(process.env.NEXT_PUBLIC_API_RATE_LIMIT)

      onAddError(`Démarrage de la recherche...
      Paramètres : jours=${maxPeriod}, liquiditéMax=${maxCost}
      Plage de dates : ${fromDate} à ${toDate}`)

      if (!data.data || !data.data.results) {
        throw new Error('Format de réponse API invalide')
      }

      onAddError(`${data.data.results.length} pools trouvés à traiter`)

      const totalPools = data.data.results.length
      let processedPools = 0
      let matchingPools = 0
      for (let i = 0; i < data.data.results.length; i++) {
        if (stop) {
          onAddError('Recherche arrêtée par l\'utilisateur')
          setLoading(true)
          break
        }
        const APILimit = process.env.NEXT_PUBLIC_API_RATE_LIMIT ? parseInt(process.env.NEXT_PUBLIC_API_RATE_LIMIT) : 0
        const poolData = data.data.results[i]
        const estimatedTimeRemaining = (totalPools - i) * (APILimit / 1000)
        if (poolData && poolData.address) {
          try {
            const liquidity = await getLiquidity(poolData.address)
            const holders = await getTokenHolders('ether', poolData.mainToken?.address)
            const deployers = await getDeployerAddresses(poolData.address, stop) // [0x0xBDf8ab3Ab62DDBd9aE12Aae034B99ff042788845 || null, 0xBDf8ab3Ab62DDBd9aE12Aae034B99ff042788845 || null]
            processedPools++

            onAddError(`Pool ${poolData.mainToken?.symbol || 'Inconnu'} liquidité: $${liquidity}`)

            if (Number(liquidity) <= maxCost) {
              matchingPools++

              onAddError(`Pool trouvé : ${poolData.mainToken?.symbol} avec liquidité $${liquidity}`)

              let alreadyExist = await confirmDataExist(poolData.address);

              let tempData = {
                alreadyExist,
                badgeText: formatTimeAgo(poolData.creationTime),
                mainTokenName: poolData.mainToken?.name || 'Inconnu',
                mainTokenSymbol: poolData.mainToken?.symbol || 'Inconnu',
                holdersDisplay: holders !== null ? holders?.toLocaleString() : null,
                dextoolsUrl: `https://www.dextools.io/app/en/ether/pair-explorer/${poolData.address}`,
                liquidity: formatLiquidityFriendly(liquidity), //formatLiquidityFriendly(liquidity)
                formattedLiquidity: formatNumber(liquidity),
                sideTokenSymbol: poolData.sideToken?.symbol || 'Inconnu',
                poolCreatedTime: new Date(poolData.creationTime).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }),
                mainTokenAddress: poolData.mainToken?.address || 'N/A',
                poolAddress: poolData.address || 'N/A',
                deployers: deployers,
              }

              if (!alreadyExist) {
                tempData.alreadyExist = true
                console.log("Store to database")

                const { error } = await supabase.from("pool").insert({
                  added_at: new Date(),
                  mainTokenName: tempData?.mainTokenName,
                  mainTokenSymbol: tempData?.mainTokenSymbol,
                  holdersDisplay: tempData?.holdersDisplay,
                  liquidity: tempData?.liquidity,
                  formattedLiquidity: tempData?.formattedLiquidity,
                  sideTokenSymbol: tempData?.sideTokenSymbol,
                  poolCreatedTime: tempData?.poolCreatedTime,
                  mainTokenAddress: tempData?.mainTokenAddress,
                  poolAddress: tempData?.poolAddress,
                  deployers: tempData?.deployers
                });

                if (error) {
                  console.log(error)
                } else {
                  console.log("this data added successfully")
                }
              }

              onAddTokenData(tempData)
            }
            await sleep(process.env.NEXT_PUBLIC_API_RATE_LIMIT)
          } catch (error: any) {
            onAddError(`Erreur lors du traitement du pool ${poolData.address}: ${error?.message}`)
            await sleep(process.env.NEXT_PUBLIC_API_RATE_LIMIT)
            continue
          }
        }
      }
    }
  }

  const onCancelSearch = () => {
    if (!stop) setStop(true)
  }

  useEffect(() => {
    autoSaveRef.current = autoSave
  }, [autoSave])

  return (
    <div className="transition-all w-full py-4 px-4 md:py-10 md:px-20 gap-12 flex flex-col items-center">
      <div className="w-full rounded-2xl shadow-2xl p-4 flex gap-3 justify-between">
        <div className="w-[140px] flex">
          <div
            onClick={() => router.push('/')}
            className="w-full h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
          >Back</div>
        </div>
        <div className="w-full flex flex-col gap-3 items-center flex-1">
          <p className="text-3xl font-bold">DETECTEUR DE PROJETS</p>
          <p className="p-2 font-semibold rounded-md text-[#856404] bg-[#fff3cd] border-[#ffeeba] border-[1px]">{`Note : En raison des limites de l'API (1 appel/seconde), la recherche peut prendre du temps.`}</p>
          <div className="flex gap-2 flex-col items-center">
            <div className="flex flex-col max-w-[400px] w-full items-start gap-2">
              <p className="text-lg font-semibold">Âge maximum du token (jours) :</p>
              <input
                min={0}
                type="number"
                value={maxPeriod}
                onChange={(e: any) => setMaxdPeriod(e?.target?.value)}
                className="transition-all w-full text-lg hover:opacity-90 border-[1px] border-zinc-400 rounded-md py-1 px-2"
              />
            </div>
            <div className="flex flex-col max-w-[400px] w-full items-start gap-2">
              <p className="text-lg font-semibold">Maximum Liquidity (USD):</p>
              <input
                min={0}
                type="number"
                value={maxCost}
                onChange={(e: any) => setMaxCost(e?.target?.value)}
                className="transition-all w-full text-lg hover:opacity-90 border-[1px] border-zinc-400 rounded-md py-1 px-2"
              />
            </div>
            {/* {
            !loading ?
              <div
                onClick={() => onSearchToken()}
                className={`transition-all bg-[#4CAF50] text-white py-[10px] px-5 rounded-md text-lg w-max ${!loading ? " cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-50 hover:opacity-30"}`}
              >Rechercher</div> :
              <div
                onClick={() => onCancelSearch()}
                className={`transition-all bg-[#dc3545] text-white py-[10px] px-5 rounded-md text-lg w-max ${!stop ? " cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-50 hover:opacity-30"}`}
              >Arrêter{stop ? "..." : ""}</div>
          } */}
            <div
              onClick={() => onSearchToken()}
              className={`transition-all bg-[#4CAF50] text-white py-[10px] px-5 rounded-md text-lg w-max ${!loading ? " cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-50 hover:opacity-30"}`}
            >Rechercher</div>
          </div>
        </div>
        <div className="w-[140px] flex flex-col gap-2">
          <div
            onClick={() => setAutoSave(!autoSave)}
            className="w-full h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
          >{autoSave ? "Stop automation" : "Add automation"}</div>
          <div
            onClick={() => router.push('/view')}
            className="w-full h-8 bg-[#FEFEFE] rounded-lg border-[1px] py-[2px] text-center text-md border-[#D3D3D3] transition-all cursor-pointer hover:opcaity-80"
          >Access DB</div>
        </div>
      </div>
      {loading && <p className="text-lg font-semibold">Recherche en cours...</p>}
      <div className="w-full flex flex-col">
        {
          tokenData?.length > 0 &&
          tokenData.map((e: any, index: number) => {
            return (
              <div className="w-full" key={index}>
                <TokenCard data={e} />
              </div>
            )
          })
        }
      </div>
      {
        errorMsg?.length > 0 &&
        <div
          ref={errRef}
          className="w-full rounded-2xl text-xs shadow-2xl p-[10px] bg-[#f8f9fa] border-[1px] border-[#ddd] rounded-lg flex flex-col gap-[1px] max-h-[300px] overflow-y-auto h-max"
          style={{ lineBreak: 'anywhere' }}
        >
          {
            errorMsg.map((e: string, index: number) => {
              return (
                <div className="" key={index}>{e}</div>
              )
            })
          }
        </div>
      }
    </div >
  )
}

export default Home