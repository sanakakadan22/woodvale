import Ably from "ably/promises";

const rest = new Ably.Rest(process.env.ABLY_API_KEY);

export default async function handler(req, res) {
  const tokenParams = {
    clientId: "woodvale-app",
  };
  rest.auth.createTokenRequest(tokenParams, (err, tokenRequest) => {
    if (err) {
      res.status(500).send("Error requesting token: " + JSON.stringify(err));
    } else {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(tokenRequest));
    }
  });
}
