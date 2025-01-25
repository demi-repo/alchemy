"use client"

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()
  return (
    <div className="background flex justify-center items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div
        className="text-2xl font-semibold opacity-75 transition-all cursor-pointer hover:opacity-80 p-20 border-[1px] border-zinc-600 hover:border-zinc-800 rounded-3xl bg-zinc-100 hover:bg-zinc-300"
        onClick={() => router.push('/home')}
      >DÉTECTEUR DE PROJETS</div>
      <div
        className="text-2xl font-semibold opacity-75 transition-all cursor-pointer hover:opacity-80 p-20 border-[1px] border-zinc-600 hover:border-zinc-800 rounded-3xl bg-zinc-100 hover:bg-zinc-300"
        onClick={() => router.push('/visualization')}
      >VISUALISATION</div>
      <div
        className="text-2xl font-semibold opacity-75 transition-all cursor-pointer hover:opacity-80 p-20 border-[1px] border-zinc-600 hover:border-zinc-800 rounded-3xl bg-zinc-100 hover:bg-zinc-300"
        // onClick={() => router.push('/home')}
      >SUIVI WALLET</div>
      <div
        className="text-2xl font-semibold opacity-75 transition-all cursor-pointer hover:opacity-80 p-20 border-[1px] border-zinc-600 hover:border-zinc-800 rounded-3xl bg-zinc-100 hover:bg-zinc-300"
        // onClick={() => router.push('/home')}
      >NOUVEAUX PROJETS</div>
    </div>
  );
}
