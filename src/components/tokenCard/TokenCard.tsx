import { supabase } from "@/supabase";

const TokenCard = (props: any) => {
  const { data, type = "normal" } = props;

  const {
    alreadyExist = false,
    badgeText = "",
    mainTokenName = "",
    mainTokenSymbol = "",
    holdersDisplay = "",
    dextoolsUrl = "",
    liquidity = "",
    formattedLiquidity = "",
    sideTokenSymbol = "",
    poolCreatedTime = "",
    mainTokenAddress = "",
    poolAddress = "",
    deployers = [],
  } = data;

  const onAdd = async () => {
    let addbtn = document.getElementById(`add-${poolAddress}`)
    let addedbtn = document.getElementById(`added-${poolAddress}`)
    if (addbtn) addbtn.style.display = 'none';
    if (addedbtn) addedbtn.style.display = 'block';

    const { data } = await supabase
      .from("pool")
      .select("*")
      .eq("poolAddress", poolAddress)

    if (data?.length > 0) {
      console.log("this data is already exist")
      return
    }

    const { error } = await supabase.from("pool").insert({
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
    });

    if (error) {
      console.log(error)
    } else {
      console.log("this data added successfully")
    }
  }

  const onHide = () => {
    let card = document.getElementById(`${poolAddress}`)
    if (card) card.style.display = 'none';
  }

  return (
    <div id={poolAddress} className="mb-5 transition-all relative rounded-2xl shadow-2xl w-full p-5 mb-4 flex flex-col w-full border-[#ddd] border-[1px]">
      <div className="flex justify-between items-center w-full">
        {type == "normal" && <div className="time-badge">{badgeText}</div>}
        <div className="flex justify-between mb-4 pb-3 border-b-[1px] border-b-[#eee] pr-[120px] w-full">
          <div className="flex gap-2">
            <h3 className="text-xl font-bold text-[#2c3e50]">{mainTokenName} ({mainTokenSymbol})</h3>
            <p className="bg-[#17a2b8] py-[2px] px-[6px] rounded-md ml-2 text-md font-bold text-white">{holdersDisplay} holders</p>
          </div>
          <div className="token-links">
            <a href={dextoolsUrl} target="_blank" className="token-link">Voir sur DexTools</a>
          </div>
        </div>
      </div>
      <div className="token-info">
        <div className="info-item">
          <div className="info-label">Liquidité</div>
          <div className="info-value liquidity-value">
            {liquidity}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">Exchange</div>
          <div className="info-value">{formattedLiquidity}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Paire</div>
          <div className="info-value">{mainTokenSymbol} / {sideTokenSymbol}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Date de création</div>
          <div className="info-value">{poolCreatedTime}</div>
        </div>
      </div>
      <div className="token-info mt-[15px]">
        <div className="info-item">
          <div className="info-label">Adresse du Token</div>
          <div className="info-value address">{mainTokenAddress}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Adresse du Pool</div>
          <div className="info-value address">{poolAddress}</div>
        </div>
      </div>
      <div className="transaction-info mt-[15px]">
        <div className="info-item">
          <div className="info-label">Wallet First Transaction</div>
          <div className="info-value address">{deployers[0] || 'N/A'}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Wallet Next Transaction</div>
          <div className="info-value address">{deployers[1] || 'N/A'}</div>
        </div>
      </div>
      {
        type == "normal" &&
        <div className="p-2 flex justify-end gap-2">
          <button className="button-hidden" onClick={() => onHide()}>Hide</button>
          <button id={`added-${poolAddress}`} className={`button-add opacity-30 cursor-not-allowed bg-green ${!alreadyExist && 'hidden'}`} disabled>Added</button>:
          <button id={`add-${poolAddress}`} className={`button-add ${alreadyExist && 'hidden'}`} onClick={() => onAdd()}>Add</button>
        </div>
      }
    </div>
  )
}

export default TokenCard