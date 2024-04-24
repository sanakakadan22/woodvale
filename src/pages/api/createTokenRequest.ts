import Ably from "ably/promises";
import { NextApiRequest, NextApiResponse } from "next";

const rest = new Ably.Rest(process.env.ABLY_API_KEY ?? "");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.cookies["presence-token"];
  if (!token) {
    res.status(400).send("No token found in cookies");
    return;
  }

  const tokenParams = {
    clientId: token,
  };
  // @ts-ignore
  rest.auth.createTokenRequest(tokenParams, (err, tokenRequest) => {
    if (err) {
      res.status(500).send("Error requesting token: " + JSON.stringify(err));
    } else {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(tokenRequest));
    }
  });
}
