/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ETHEREUM_SEPOLIA_RPC_URL: string
  readonly VITE_SMART_CONTRACT_ADDRESS: string
  readonly VITE_BACKEND_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
