import { Network, Alchemy, AssetTransfersResponse, TransactionReceipt, AssetTransfersCategory } from "alchemy-sdk";

// Alchemy configuration
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY || "", // Replace with your Alchemy API Key
  network: Network.ETH_MAINNET, // Adjust for the relevant network
};

const { EXTERNAL, INTERNAL, ERC20, ERC721 } = AssetTransfersCategory

const alchemy = new Alchemy(settings);


/**
 * Fetches deployer addresses for a given pool contract address.
 *
 * @param poolAddress - The contract address of the pool.
 * @returns An array containing deployer addresses (null if not found).
 */
export async function getDeployerAddresses(
  poolAddress: string
): Promise<(string | null)[]> {
  try {
    // Fetch transactions related to the contract
    const assetTransfers: AssetTransfersResponse = await alchemy.core.getAssetTransfers({
      toAddress: poolAddress,
      category: [EXTERNAL, INTERNAL, ERC20, ERC721], // Include all relevant transaction types
      maxCount: 5, // Retrieve up to 5 transactions
    });

    // Default to null if no deployer is found
    const deployerAddresses: (string | null)[] = [null, null];

    if (assetTransfers.transfers.length === 0) {
      console.log("No transactions found for this contract address.");
      return deployerAddresses;
    }

    // Process each transaction
    for (let i = 0; i < assetTransfers.transfers.length; i++) {
      const transfer = assetTransfers.transfers[i];
      const transactionHash = transfer.hash;

      console.log(`Transaction Hash: ${transactionHash}`);

      if (i > 0 && assetTransfers.transfers[i].hash === assetTransfers.transfers[0].hash) {
        continue;
      }

      // Fetch transaction receipt
      const transactionReceipt: TransactionReceipt | null = await alchemy.core.getTransactionReceipt(transactionHash);

      if (!transactionReceipt) {
        console.log("No transaction receipt found for this hash.");
        continue;
      }

      deployerAddresses[i === 0 ? 0 : 1] = transactionReceipt.from;
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
