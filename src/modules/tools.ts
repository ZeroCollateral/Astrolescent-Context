import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleExpectedTokenYield, handleLiquidationRisk, handleTokenYield, handleReceiptHealth } from "../utils/root";

export function registerTools(server: McpServer) {
 
  // [
  //   { "role": "user", "content": "What is the current supply rate of usdc ?" }
  // ]
  server.tool(
    "current api",
    {
      messages: z.array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      ),
    },
    async ({ messages }) => {
      console.log("Incoming messages:", JSON.stringify(messages, null, 2));

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("Invalid request: 'messages' must be a non-empty array.");
      }

      const last = messages[messages.length - 1]?.content.toLowerCase();

      const tokenMap = {
        usdc: "usd-coin",
        bitcoin: "bitcoin",
        usdt: "tether",
        ethereum: "radix",
        lsulp: "caviarnine-lsu-pool-lp",
      };

      const matchedToken = Object.keys(tokenMap).find(t => last.includes(t));
      const tokenKey = matchedToken && matchedToken in tokenMap ? tokenMap[matchedToken as keyof typeof tokenMap] : null;


      console.log("matchedToken:", matchedToken);
      console.log("tokenKey:", tokenKey);

      if (tokenKey) {
        console.log("I will look for the token yield for you:");
        const result = await handleTokenYield(tokenKey);
        console.log("token yield:", result);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: "Please specify a token like USDC, USDT, or ETH to get yield info.",
          },
        ],
      };
    }
  );


  // [
  //   { "role": "user", "content": "What is the expected supply rate change if i supply 10.000 usdc ?" }
  // ]
  server.tool(
    "expected api",
    {
      messages: z.array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      ),
    },
    async ({ messages }) => {
      console.log("Incoming messages:", JSON.stringify(messages, null, 2));

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("Invalid request: 'messages' must be a non-empty array.");
      }

      const last = messages[messages.length - 1]?.content.toLowerCase();

      const tokenMap = {
        usdc: "usd-coin",
        bitcoin: "bitcoin",
        usdt: "tether",
        ethereum: "ethereum",
        radix: "radix",
        lsulp: "caviarnine-lsu-pool-lp",
      };

      const matchedToken = Object.keys(tokenMap).find(t => last.includes(t));
      const tokenKey = matchedToken && matchedToken in tokenMap ? tokenMap[matchedToken as keyof typeof tokenMap] : null;

      console.log("matchedToken:", matchedToken);
      console.log("tokenKey:", tokenKey);

      if (tokenKey) {
        console.log("I will look for the token yield for you for tokenKey:", tokenKey);
        const result = await handleExpectedTokenYield(tokenKey);
        console.log("token yield expected:", result);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: "Please specify a token like USDC, USDT, Bitcoin, ETH, Radix or LsuLp to get yield info.",
          },
        ],
      };
    }
  );

// Example request for MCP Inspector
// [
//     { "role": "user", "content": "What is the risk of being liquidated if radix moves -10% given I hold this receipt #27# ?" }
//   ]
server.tool(
    "liquidation risk",
    {
      messages: z.array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      ),
    },
    async ({ messages }) => {
      console.log("Incoming messages:", JSON.stringify(messages, null, 2));

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("Invalid request: 'messages' must be a non-empty array.");
      }

      const last = messages[messages.length - 1]?.content.toLowerCase();

      // Define regex patterns for extraction
      const tokenPattern = /(bitcoin|radix|ethereum|lsulp|hug|wowo|early)/i;  // Detecting 'bitcoin', 'radix', or 'ethereum'
      const percentagePattern = /([-+]?\d{1,3})%/; // Captures numbers with optional +/- sign followed by '%' (e.g., -10%)
      const receiptPattern = /#(\d+)#/; // Captures the receipt like '#1#'

      // Match the token (e.g., bitcoin, radix, ethereum)
      const tokenMatch = last.match(tokenPattern);
      const tokenKey = tokenMatch ? tokenMatch[0] : null;

      // Match the percentage change (e.g., -10%)
      const percentageMatch = last.match(percentagePattern);
      const percentageChange = percentageMatch ? percentageMatch[0] : null;

      // Match the receipt number (e.g., #1#)
      const receiptMatch = last.match(receiptPattern);
      console.log("receiptMatch ?:", receiptMatch);
      const receipt = receiptMatch ? `#${receiptMatch[1]}#` : null;
      console.log("receipt ?:", receipt);

      console.log("Extracted token:", tokenKey);
      console.log("Extracted percentage change:", percentageChange);
      console.log("Extracted receipt:", receipt);

      // If token and other data are extracted, proceed to API interaction
      if (tokenKey && percentageChange && receipt) {
        const direction = percentageChange.startsWith('-') ? 'down' : 'up'; // Direction based on percentage
        console.log("I will look for your current risk given the data extracted:", { tokenKey, percentageChange, receipt, direction });

        // Fetch risk info using the extracted data
        const result = await handleLiquidationRisk(tokenKey, direction, receipt, percentageChange);
          return {
            content: [{ type: "text", text: result }],
          };
      }

      return {
        content: [
          {
            type: "text",
            text: "Please specify a receipt in the correct format like #1# and one of the tokens like Bitcoin, Radix, Ethereum, LsuLp, Hug, Wowo or Early along with a percentage change (e.g., -10%).",
          },
        ],
      };
    }
  );  


// Example request for MCP Inspector
// [
//     { "role": "user", "content": "What is the risk of being liquidated if radix moves -10% given I hold this receipt #27# ?" }
//   ]
server.tool(
    "receipt health",
    {
      messages: z.array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      ),
    },
    async ({ messages }) => {
      console.log("Incoming messages:", JSON.stringify(messages, null, 2));

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("Invalid request: 'messages' must be a non-empty array.");
      }

      const last = messages[messages.length - 1]?.content.toLowerCase();

      // Define regex patterns for extraction
      const receiptPattern = /#(\d+)#/; // Captures the receipt like '#1#'

      // Match the receipt number (e.g., #1#)
      const receiptMatch = last.match(receiptPattern);
      console.log("receiptMatch ?:", receiptMatch);
      const receipt = receiptMatch ? `#${receiptMatch[1]}#` : null;
      console.log("Extracted receipt:", receipt);

      // If token and other data are extracted, proceed to API interaction
      if (receipt) {
        
        // Fetch health 
        const result = await handleReceiptHealth(receipt);
          return {
            content: [{ type: "text", text: result }],
          };
      }

      return {
        content: [
          {
            type: "text",
            text: "Please specify a receipt in the correct format like #1# .",
          },
        ],
      };
    }
  );  

}


