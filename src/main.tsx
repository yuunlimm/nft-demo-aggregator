import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Network } from "@aptos-labs/ts-sdk";
import "./index.css";

const getNetwork = (input: string | null): Network => {
  switch (input?.toLowerCase()) {
    case "devnet": return Network.DEVNET;
    case "testnet": return Network.TESTNET;
    case "mainnet": return Network.MAINNET;
    default: return Network.MAINNET;
  }
};

const network = getNetwork(new URLSearchParams(window.location.search).get("network"));

if (!window.location.search.includes("network")) {
  window.history.replaceState({}, "", `?network=${Network.MAINNET}`);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <BrowserRouter>
        <App network={network} />
      </BrowserRouter>
  </React.StrictMode>
);