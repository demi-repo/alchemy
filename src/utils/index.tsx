import { Network, Alchemy, AssetTransfersResponse, TransactionReceipt, AssetTransfersCategory } from "alchemy-sdk";

// Alchemy configuration
//console.log("ALCHEMY KEY:", process.env.ALCHEMY_API_KEY);

const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "", // Replace with your Alchemy API Key
  network: Network.ETH_MAINNET, // Adjust for the relevant network
};

const { EXTERNAL, INTERNAL, ERC20, ERC721 } = AssetTransfersCategory

const alchemy = new Alchemy(settings);

/**
 * Fetches deployer addresses for a given pool contract address.
 *
 * @param {string} poolAddress - The contract address of the pool.
 * @returns {Promise<string[]>} - An array containing deployer addresses (null if not found).
 */
export const getDeployerAddresses = async (poolAddress: any, stop: boolean) => {
  try {
    // Fetch transactions related to the contract
    const assetTransfers: AssetTransfersResponse = await alchemy.core.getAssetTransfers({
      toAddress: poolAddress,
      category: [EXTERNAL, INTERNAL, ERC20, ERC721],
      maxCount: 5, // Retrieve up to 2 transactions
    });

    // Default to null if no deployer is found
    const deployerAddresses: any[] = [null, null];

    if (assetTransfers.transfers.length === 0) {
      console.log("No transactions found for this contract address.");
      return deployerAddresses;
    }

    // Process each transaction
    for (let i = 0; i < assetTransfers.transfers.length; i++) {
      if (stop) return null;
      const transfer = assetTransfers.transfers[i];
      const transactionHash = transfer.hash;

      console.log(`Transaction Hash: ${transactionHash}`);

      if (i > 0 && assetTransfers.transfers[i].hash == assetTransfers.transfers[0].hash) {
        continue;
      }
      // Fetch transaction receipt
      const transactionReceipt = await alchemy.core.getTransactionReceipt(transactionHash);

      if (!transactionReceipt) {
        console.log("No transaction receipt found for this hash.");
        continue;
      }

      deployerAddresses[i == 0 ? 0 : 1] = transactionReceipt.from;
      if (i > 0) {
        break;
      }
    }

    return deployerAddresses;
  } catch (error) {
    console.error("Error fetching deployer address:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}
