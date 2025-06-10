import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "echo",
    { message: z.string() },
    ({ message }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please process this message: ${message}`
        }
      }]
    })
  );

  server.prompt(
    "current apy",
    {
      token: z.string()
    },
    ({ token }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `What is the current supply rate of ${token} ?`
          }
        }
      ]
    })
  );

  server.prompt(
    "expected apy",
    {
      token: z.string(),
      amount: z.string()
    },
    ({ token, amount }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `What is the expected supply rate change if i supply ${amount} of ${token} ?`
          }
        }
      ]
    })
  );
  
  server.prompt(
    "liquidation risk",
    {
      token: z.string(),
      expectedMovement: z.string(),
      receiptId: z.string()
    },
    ({ token, expectedMovement, receiptId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `What is the risk of being liquidated if ${token} moves ${expectedMovement} given this receipt #${receiptId}#?`
          }
        }
      ]
    })
  );

    server.prompt(
    "Receipt Health",
    {
      receiptId: z.string()
    },
    ({ receiptId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `What is the percentage distribution by risk of the collaterals provided with this receipt #${receiptId}#?`
          }
        }
      ]
    })
  );




}
