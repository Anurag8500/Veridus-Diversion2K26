export interface MintResult { 
 chain: string; 
 assetId: string; 
 txHash: string; 
 } 
 export interface BlockchainAdapter { 
 mintCredentialNFT( 
 metadataCID: string, 
 studentWallet: string 
 ): Promise<MintResult>; 
 } 
