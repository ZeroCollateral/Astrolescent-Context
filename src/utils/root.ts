// mcp/src/handlers/tokenYield.ts

import axios from 'axios';
import { getApyExtendedFromStats, getApyFromStats } from './getTokenApy';

export async function handleTokenYield(tokenKey: string): Promise<string> {
  try {
    const statsResponse = await axios.get('https://backend-prod.rootfinance.xyz/api/markets/stats'); // replace with real port
    const stats = statsResponse.data;

    const apy = getApyFromStats(stats, tokenKey);

    if (!apy) {
      return `Token '${tokenKey}' not found in the stats data.`;
    }

    return `Current yield for ${tokenKey}:
      - Supply APY: ${apy.supplyAPY.toFixed(2)}%
      - Borrow APY: ${apy.borrowAPY.toFixed(2)}%`;

  } catch (err) {
    console.error('Error in handleTokenYield:', err);
    return `Failed to fetch yield data for ${tokenKey}.`;
  }
}


export async function handleExpectedTokenYield(tokenKey: string): Promise<string> {
  try {
    const statsResponse = await axios.get('https://backend-prod.rootfinance.xyz/api/markets/stats'); // replace with real port
    const stats = statsResponse.data;

    const apy = getApyExtendedFromStats(stats, tokenKey);

    if (!apy) {
      return `Token '${tokenKey}' not found in the stats data.`;
    }

    // Slope 1 (0% – 4%): Low increase
    // Slope 2 (4% – 75%): Moderate increase
    // Slope 3 (75% – 100%): Steep increase

    return `Current yield for ${tokenKey}:
      - Supply APY: ${apy.supplyAPY.toFixed(2)}%
      - Borrow APY: ${apy.borrowAPY.toFixed(2)}%
      - Total Supply: ${apy.totalSupply}
      - Total Borrow: ${apy.totalBorrow}
      - Available Liquidity: ${apy.availableLiquidity}
      - Slopes to calculate the Borrow Rate:
          Slope 1: 0%
          Slope 2: 4%
          Slope 3: 75%
      - Reserve Factor 30%: 30%
      - Optimal Usage: ${apy.optimalUsage}
      - LTV Limit: ${apy.LTVLimit}
      `;

  } catch (err) {
    console.error('Error in handleTokenYield:', err);
    return `Failed to fetch yield data for ${tokenKey}.`;
  }
}



//
// RESPONSE from the health Bar
// {
//   "totalSupply": "50.955467045",
//   "totalBorrow": "30.3303",
//   "netApyPercentage": 10.208871924702537,
//   "totalBorrowLimit": "38.101841997",
//   "borrowLimitUsedPercentage": 79.60323808593847,
//   "liquidation": 1.0668674588606664
// }

const tokenResourceMap: Record<string, string> = {
  bitcoin: "resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
  radix: "resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd",
  ethereum: "resource_rdx1th88qcj5syl9ghka2g9l7tw497vy5x6zaatyvgfkwcfe8n9jt2npww",
  lsulp: "resource_rdx1thksg5ng70g9mmy9ne7wz0sc7auzrrwy7fmgcxzel2gvp8pj0xxfmf",
  hug: "resource_rdx1t5kmyj54jt85malva7fxdrnpvgfgs623yt7ywdaval25vrdlmnwe97",
  early: "resource_rdx1t5xv44c0u99z096q00mv74emwmxwjw26m98lwlzq6ddlpe9f5cuc7s",
  wowo: "resource_rdx1t4kc5ljyrwlxvg54s6gnctt7nwwgx89h9r2gvrpm369s23yhzyyzlx",
  usdc: "resource_rdx1t4upr78guuapv5ept7d7ptekk9mqhy605zgms33mcszen8l9fac8vf",
  usdt: "resource_rdx1thrvr3xfs2tarm2dl9emvs26vjqxu6mqvfgvqjne940jv0lnrrg7rw"  
};

const tokenRiskLevelMap: Record<string, string> = {
  bitcoin: "low",
  radix: "high",
  ethereum: "low",
  lsulp: "high",
  hug: "meme",
  early: "meme",
  wowo: "meme",
  usdc: "stablecoin",
  usdt: "stablecoin"  
};

export async function handleLiquidationRisk(tokenKey: string, direction: string, receipt: string, percentageChange: string): Promise<string> {
  try {

    // Step 1: Prepare request payload for receipt data
    const receiptPayload = {
      resource_address: "resource_rdx1ngekvyag42r0xkhy2ds08fcl7f2ncgc0g74yg6wpeeyc4vtj03sa9f",
      non_fungible_ids: [receipt], // e.g. "#27#"
    };

    // Step 2: Make API request
    const response = await axios.post(
      "https://mainnet.radixdlt.com/state/non-fungible/data",
      receiptPayload
    );

    const receiptData = response.data?.non_fungible_ids?.[0]?.data?.programmatic_json?.fields || [];

    // Step 3: Helper function to extract entries by field_name
    const extractField = (
      fields: any[],
      fieldName: string,
      filterResource?: string
    ): { address: string; amount: string }[] => {
      const field = fields.find(f => f.field_name === fieldName && f.entries);
      return field?.entries
        ?.filter((entry: any) => !filterResource || entry.key?.value === filterResource)
        ?.map((entry: any) => ({
          address: entry.key?.value,
          amount: entry.value?.value
        })) || [];
    };    

    // Step 4: Extract and prepare new payload
    const supplies: never[] = [];
    const cdps = extractField(receiptData, "collaterals");
    const borrows = extractField(receiptData, "loans");

    const tokenResource = tokenResourceMap[tokenKey.toLowerCase()];
    console.log("tokenResource to be evaluated:", tokenResource);
    const supplyVolatileToken = extractField(receiptData, "collaterals", tokenResource);
    console.log("Amount supplied on volatile token:", supplyVolatileToken);

    const finalPayload = {
      supplies,
      cdps,
      borrows
    };

    console.log("Prepared payload for second API:", JSON.stringify(finalPayload, null, 2));

    // Fetch health data
    const healthResponse = await axios.post('https://backend-prod.rootfinance.xyz/api/markets/health-bar', finalPayload);
    const stats = healthResponse.data;

    const tokenAliases: Record<string, string> = {
      lsulp: 'caviarnine-lsu-pool-lp',
      btc: 'bitcoin',
      eth: 'ethereum',
      xrd: 'radix',
      hug: 'hug',
      wowo: 'wowo',
      early: 'early-radix',
    };

    const assetsUsdPrices = await fetchCoinsPrices();
    console.log("all assetsUsdPrices:", assetsUsdPrices);

    // Translate to real key if alias exists
    const realKey = tokenAliases[tokenKey.toLowerCase()] || tokenKey.toLowerCase();
    const currentPrice = assetsUsdPrices?.[realKey.toLowerCase()] || 0;

    // Formatting risk response
    const currentBL = parseFloat(stats.borrowLimitUsedPercentage!.toFixed(2));
    const currentCollateral = parseFloat(stats.totalSupply);
    const currentLoan = parseFloat(stats.totalBorrow);
    const projectedBL = (currentBL + 12).toFixed(2); // TODO — set this with logic from actual data
    const volatileSupplyAmount = supplyVolatileToken[0]?.amount || "0";
    console.log("currentPrice and amount held of the token :", tokenKey, currentPrice, volatileSupplyAmount);

    const currentValue = Number(volatileSupplyAmount) * currentPrice;
    console.log("current USD Value of the volatile token :", currentValue.toFixed(10));

    const percentage = Math.abs(Number(percentageChange.replace('%', ''))) / 100;
    const isDown = direction === "down";

    // Calculate adjusted price
    const expectedPrice = currentPrice * (isDown ? 1 - percentage : 1 + percentage);

    // Value projections
    const expectedValue = Number(volatileSupplyAmount) * expectedPrice;
    console.log(`Expected Value of the volatile token if price goes ${direction} ${percentageChange}:`, expectedValue);

    //Calculate current total value of the CDP
    let totalUsd = 0;
    let totalLoanUsd = 0;
    // Function to get the correct price key for a token
    // TODO fix this logic to be more generic
    function getPriceForToken(token: string): number | undefined {
      let priceKey: string;
      switch (token) {
        case "lsulp":
          priceKey = "caviarnine-lsu-pool-lp";
          break;
        case "usdc":
          priceKey = "usd-coin";
          break;
        default:
          priceKey = token;
      }
      return assetsUsdPrices ? assetsUsdPrices[priceKey] : undefined;
    }

    const mcpResponse = `Receipt ${receipt}: Your current borrow limit usage is ${currentBL}%. 
      You have a total of ${currentCollateral}usd in your CDP 
      You have a total borrow of ${currentLoan}usd in your CDP
      You have deposited ${currentValue} worth of ${tokenKey}. 
      If ${tokenKey} moves ${direction} of ${percentageChange}, 
      your supplied value will change from ${currentValue}usd to ${expectedValue}usd`;       
      // your projected borrow limit usage could rise to ${projectedBL}%, which may put you at risk of liquidation.`; 

    console.log("MCP Response:", mcpResponse);
    return mcpResponse;


  } catch (err) {
    console.error('Error in handleLiquidationRisk:', err);
    return `Failed to fetch liquidation risk data for ${tokenKey} and ${receipt} `;
  }
}


export async function handleReceiptHealth(receipt: string): Promise<string> {
  try {

    // Step 1: Prepare request payload for receipt data
    const receiptPayload = {
      resource_address: "resource_rdx1ngekvyag42r0xkhy2ds08fcl7f2ncgc0g74yg6wpeeyc4vtj03sa9f",
      non_fungible_ids: [receipt], // e.g. "#27#"
    };
    // Step 2: Make API request
    const response = await axios.post(
      "https://mainnet.radixdlt.com/state/non-fungible/data",
      receiptPayload
    );

    const receiptData = response.data?.non_fungible_ids?.[0]?.data?.programmatic_json?.fields || [];

    // Step 3: Helper function to extract entries by field_name
    const extractField = (
      fields: any[],
      fieldName: string,
      filterResource?: string
    ): { address: string; amount: string }[] => {
      const field = fields.find(f => f.field_name === fieldName && f.entries);
      return field?.entries
        ?.filter((entry: any) => !filterResource || entry.key?.value === filterResource)
        ?.map((entry: any) => ({
          address: entry.key?.value,
          amount: entry.value?.value
        })) || [];
    };    

    // Step 4: Extract and prepare new payload
    const supplies: never[] = [];
    const cdps = extractField(receiptData, "collaterals");
    const borrows = extractField(receiptData, "loans");

    const finalPayload = {
      supplies,
      cdps,
      borrows
    };

    console.log("Prepared payload for second API:", JSON.stringify(finalPayload, null, 2));

    // Fetch health data
    const healthResponse = await axios.post('https://backend-prod.rootfinance.xyz/api/markets/health-bar', finalPayload);
    const stats = healthResponse.data;

    const tokenAliases: Record<string, string> = {
      lsulp: 'caviarnine-lsu-pool-lp',
      btc: 'bitcoin',
      eth: 'ethereum',
      xrd: 'radix',
      hug: 'hug',
      wowo: 'wowo',
      early: 'early-radix',
    };

    const riskDistribution = calculateCollateralRiskDistribution(cdps);
    console.log("Collateral Distribution by Risk Level:", riskDistribution);
    const percentages = getRiskDistributionPercentages(riskDistribution);
    console.log("Percentage Distribution by Risk:", percentages);

    // Formatting risk response
    const currentBL = parseFloat(stats.borrowLimitUsedPercentage?.toFixed(2));
    const currentCollateral = parseFloat(stats.totalSupply);
    const currentLoan = parseFloat(stats.totalBorrow);

    const mcpResponse = `Receipt ${receipt}: Your current borrow limit usage is ${currentBL}%. 
      You have a total of ${currentCollateral}usd in your CDP 
      You have a total borrow of ${currentLoan}usd in your CDP
      You have a percentage distribution by risk level: ${JSON.stringify(percentages)} `;

    console.log("MCP Response:", mcpResponse);
    return mcpResponse;


  } catch (err) {
    console.error('Error in handleReceiptHealth:', err);
    return `Failed to fetch health data for ${receipt} `;
  }
}

type TokenData = {
  address: string;
  amount: string; // assuming string numbers
};

// Step 1: Reverse the resource → token map
const resourceToTokenMap: Record<string, string> = Object.fromEntries(
  Object.entries(tokenResourceMap).map(([token, resource]) => [resource, token])
);

// Step 2: Group collaterals by risk level
function calculateCollateralRiskDistribution(cdps: TokenData[]) {
  const riskSums: Record<string, number> = {};

  for (const cdp of cdps) {
    const token = resourceToTokenMap[cdp.address];
    const risk = tokenRiskLevelMap[token] ?? "unknown";

    const amount = parseFloat(cdp.amount) || 0;

    riskSums[risk] = (riskSums[risk] || 0) + amount;
  }

  return riskSums;
}

function getRiskDistributionPercentages(riskSums: Record<string, number>) {
  const total = Object.values(riskSums).reduce((sum, val) => sum + val, 0);

  const percentages: Record<string, number> = {};
  for (const [risk, amount] of Object.entries(riskSums)) {
    percentages[risk] = total > 0 ? Math.round((amount / total) * 100) : 0;
  }

  return percentages;
}


// Invert tokenResourceMap to find token by address
const resourceToToken = Object.fromEntries(
  Object.entries(tokenResourceMap).map(([token, address]) => [address, token])
);

const COINGECKO_TOKENS_LIST="radix,bitcoin,ethereum,caviarnine-lsu-pool-lp,hug,wowo,early-radix,tether,usd-coin";


export async function fetchCoinsPrices() {
  
    console.log("Fetching crypto prices for tokens:", COINGECKO_TOKENS_LIST);
    try {
        const resData = (
            await axios.get("https://api.coingecko.com/api/v3/simple/price", {
                params: {
                    ids: COINGECKO_TOKENS_LIST,
                    vs_currencies: "usd",
                },
            })
        ).data;

        const prices: { [key: string]: number } = {};
        for (const key in resData) {
            if (resData.hasOwnProperty(key)) {
                prices[key] = resData[key].usd;
            }
        }

        return prices;
    } catch (error) {
        console.error("Error fetching crypto prices:", error);
        return null;
    }
}