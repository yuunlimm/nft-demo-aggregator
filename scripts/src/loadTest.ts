import {
    Account,
    Aptos,
    AptosConfig,
    Network,
    NetworkToNetworkName,
    NewTransactionWorker,
    InputGenerateTransactionPayloadData,
    Ed25519PrivateKey,
    Ed25519Account,
  } from "@aptos-labs/ts-sdk";
  import * as fs from "fs/promises";
  import { existsSync, mkdirSync } from "fs";
  import path from "path";
  import dotenv from "dotenv";
  
  // Load environment variables from .env file
  dotenv.config();
  
  // Global type declaration for signal handlers
  declare global {
    var tester: MarketplaceLoadTester | undefined;
  }
  
  // Configuration
  const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
  const NUM_ACCOUNTS = parseInt(process.env.NUM_ACCOUNTS ?? "200"); // Configurable number of accounts
  const MAX_CONCURRENT_TRANSACTIONS = parseInt(process.env.MAX_CONCURRENT_TRANSACTIONS ?? "20");
  const TEST_DURATION_SECONDS = parseInt(process.env.TEST_DURATION_SECONDS ?? "120");
  const STATUS_REPORT_INTERVAL_SECONDS = parseInt(process.env.STATUS_REPORT_INTERVAL_SECONDS ?? "5");
  const TOKENS_PER_ACCOUNT = parseInt(process.env.TOKENS_PER_ACCOUNT ?? "50"); // Number of tokens to mint per account
//   const ADDITIONAL_ACCOUNTS = parseInt(process.env.ADDITIONAL_ACCOUNTS ?? "50"); // Additional accounts for more load
  
  // Marketplace contract addresses (replace with your actual contract)
  const MARKETPLACE_ADDRESS = "0xab21dcb8b3a7145e5ba430c8b896a194721bb26f51ab1587b0645dd8cff0c7cd"
  const FEE_SCHEDULE = "0x5e2b865dd4703915771c0f2ea01dd531443f78d969f2281db7943789e8a5d1a7"; // fee schedule address
//   0xcfdd393380ebf4b26bafa79a04244f5ac7626005b5f7591d2e102da871f8cb3d
  // Collection and token configuration
  const COLLECTION_NAME = "TestCollection"; // Your collection name
  const TOKEN_NAMES = Array.from({ length: TOKENS_PER_ACCOUNT }, (_, i) => 
    `TestNFT_${String.fromCharCode(65 + i)}` // A, B, C, D, E, etc.
  ); // Dynamically generated token names based on TOKENS_PER_ACCOUNT
  
  // Cache for accounts and minted NFTs
  const CACHE_DIR = "./marketplace-test-cache";
  const ACCOUNTS_CACHE_FILE = path.join(CACHE_DIR, "accounts.json");
  const NFTS_CACHE_FILE = path.join(CACHE_DIR, "minted-nfts.json");
  const ACCOUNT_TOKEN_MAP_CACHE_FILE = path.join(CACHE_DIR, "account-token-map.json");

  const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
    throw new Error("API_KEY is not set");
    }

  
  interface MintedNFT {
    tokenId: string;
    ownerAddress: string;
    tokenName: string;
    tokenUri: string;
    listed: boolean;
  }
  
  // Map of account address to token IDs for efficient lookup
  interface AccountTokenMap {
    [accountAddress: string]: string[]; // account address -> array of token IDs
  }
  
  interface TestMetrics {
    mintedTokens: number;
    listingsCreated: number;
    mintFailures: number;
    listingFailures: number;
    totalTransactions: number;
  }
  
  class MarketplaceLoadTester {
    private aptos: Aptos;
    private accounts: Ed25519Account[] = [];
    private mintedNFTs: MintedNFT[] = [];
    private accountTokenMap: AccountTokenMap = {}; // Map of account address to token IDs
    private workers: NewTransactionWorker[] = [];
    private metrics: TestMetrics = {
      mintedTokens: 0,
      listingsCreated: 0,
      mintFailures: 0,
      listingFailures: 0,
      totalTransactions: 0,
    };
  
    constructor() {
      const config = new AptosConfig({
        network: APTOS_NETWORK,
        fullnode: process.env.FULLNODE_URL,
        indexer: process.env.INDEXER_URL,
        clientConfig: {
            API_KEY,
        }
      });
      this.aptos = new Aptos(config);
    }
  
    async initialize() {
      console.log("🚀 Initializing Marketplace Load Tester...");
      
      // Load or create accounts
      await this.loadOrCreateAccounts();
      
      // Fund accounts if needed
      await this.ensureAccountsFunded();
      
      // Load existing NFTs or mint new ones
      await this.loadOrMintNFTs();
      
      // Create transaction workers
      this.createWorkers();
      
      console.log("✅ Initialization complete!");
    }
  
    private async loadOrCreateAccounts(): Promise<void> {
      if (existsSync(ACCOUNTS_CACHE_FILE)) {
        console.log("📂 Loading accounts from cache...");
        const privateKeys = await fs.readFile(ACCOUNTS_CACHE_FILE, "utf8");
        const cachedAccounts = JSON.parse(privateKeys);
        
        // Use cached accounts and potentially create more
        this.accounts = cachedAccounts.slice(0, NUM_ACCOUNTS).map((pk: any) => {
          const privateKey = new Ed25519PrivateKey(pk, false);
          return Account.fromPrivateKey({ privateKey });
        });
        console.log(`✅ Loaded ${this.accounts.length} accounts from cache`);
        
        // Create additional accounts if needed for more load
        if (this.accounts.length < NUM_ACCOUNTS) {
          await this.createAdditionalAccounts();
        }
      } else {
        console.log("🆕 Generating new accounts...");
        await this.generateNewAccounts();
        await this.createAdditionalAccounts();
      }
    }
  
    private async generateNewAccounts(): Promise<void> {
      this.accounts = Array.from({ length: NUM_ACCOUNTS }, () => Ed25519Account.generate());
      
      // Save accounts to cache
      await this.saveAccountsToCache();
      console.log(`✅ Generated and cached ${this.accounts.length} accounts`);
    }
  
    private async createAdditionalAccounts(): Promise<void> {
      const currentCount = this.accounts.length;
      const targetCount = NUM_ACCOUNTS; // Using hardcoded value since ADDITIONAL_ACCOUNTS is commented out
      
      if (currentCount >= targetCount) {
        return; // Already have enough accounts
      }
      
      const additionalNeeded = targetCount - currentCount;
      console.log(`🆕 Creating ${additionalNeeded} additional accounts for more load...`);
      
      const additionalAccounts = Array.from({ length: additionalNeeded }, () => Ed25519Account.generate());
      this.accounts.push(...additionalAccounts);
      
      // Save updated accounts to cache
      await this.saveAccountsToCache();
      console.log(`✅ Created ${additionalNeeded} additional accounts. Total: ${this.accounts.length}`);
    }
  
    private async saveAccountsToCache(): Promise<void> {
      if (!existsSync(CACHE_DIR)) {
        mkdirSync(CACHE_DIR, { recursive: true });
      }
      
      const privateKeys = this.accounts.map((account) => account.privateKey.toString());
      await fs.writeFile(ACCOUNTS_CACHE_FILE, JSON.stringify(privateKeys));
    }
  
    private async ensureAccountsFunded(): Promise<void> {
      console.log("💰 Checking account balances...");
      
      const unfundedAccounts: Account[] = [];
      for (const account of this.accounts) {
        try {
          const balance = await this.aptos.getAccountCoinAmount({
            accountAddress: account.accountAddress,
            coinType: "0x1::aptos_coin::AptosCoin",
          });
          
          if (balance < 10_000_000) { // Less than 10 APT
            unfundedAccounts.push(account);
          }
        } catch (error) {
          // Account might not exist yet
          unfundedAccounts.push(account);
        }
      }
  
      if (unfundedAccounts.length > 0) {
        console.log(`💸 Funding ${unfundedAccounts.length} accounts...`);
        
        for (const account of unfundedAccounts) {
          try {
            await this.aptos.fundAccount({
              accountAddress: account.accountAddress,
              amount: 50_000_000, // 50 APT per account
            });
            console.log(`✅ Funded ${account.accountAddress}`);
          } catch (error) {
            console.error(`❌ Failed to fund ${account.accountAddress}:`, error);
          }
        }
      } else {
        console.log("✅ All accounts are sufficiently funded");
      }
    }
  
    private async loadOrMintNFTs(): Promise<void> {
      if (existsSync(NFTS_CACHE_FILE)) {
        console.log("📂 Loading existing NFTs from cache...");
        const nftData = await fs.readFile(NFTS_CACHE_FILE, "utf8");
        this.mintedNFTs = JSON.parse(nftData);
        console.log(`✅ Loaded ${this.mintedNFTs.length} existing NFTs`);
        
        // Also load account token map if it exists
        if (existsSync(ACCOUNT_TOKEN_MAP_CACHE_FILE)) {
          console.log("📂 Loading account token map from cache...");
          const mapData = await fs.readFile(ACCOUNT_TOKEN_MAP_CACHE_FILE, "utf8");
          this.accountTokenMap = JSON.parse(mapData);
          console.log(`✅ Loaded account token map with ${Object.keys(this.accountTokenMap).length} entries`);
        }
      } else {
        console.log("🔍 No cache found, recovering existing token IDs from blockchain...");
        await this.recoverExistingTokenIds();
      }
    }
  
    private async createCollection(): Promise<void> {
      console.log(`🏗️  Creating collections for all accounts...`);
      
      // Create collections for all accounts that will be minting
      for (let i = 0; i < this.accounts.length; i++) {
        const account = this.accounts[i];
        const accountAddress = account.accountAddress.toString();
        const collectionName = `${COLLECTION_NAME}_${accountAddress.slice(0, 8)}`;
        
        console.log(`🏗️  Creating collection for account ${i + 1}/${this.accounts.length}: ${collectionName}...`);
        
        try {
          const transaction = await this.aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
              function: `${MARKETPLACE_ADDRESS}::create_nft::create_collection_with_defaults`,
              functionArguments: [
                collectionName,
              ],
            },
          });

          const pendingTransaction = await this.aptos.signAndSubmitTransaction({
            signer: account,
            transaction,
          });

          await this.aptos.waitForTransaction({
            transactionHash: pendingTransaction.hash,
            options: { checkSuccess: true },
          });

          console.log(`✅ Collection created successfully: ${collectionName}`);
          
          // Small delay between collection creations
          if (i < this.accounts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          // Check if the error is because collection already exists
          if (error instanceof Error && (
            error.message.includes("collection already exists") ||
            error.message.includes("already exists") ||
            error.message.includes("duplicate")
          )) {
            console.log(`ℹ️  Collection ${collectionName} already exists, continuing...`);
          } else {
            console.error(`❌ Failed to create collection ${collectionName}:`, error);
            console.log(`⏭️  Continuing with next account...`);
            // Don't throw error, continue with next account
          }
        }
      }
      
      console.log(`✅ Collection creation complete for all accounts`);
    }
  
    private async mintInitialNFTs(): Promise<void> {
      console.log(`🎨 Minting ${this.accounts.length * TOKENS_PER_ACCOUNT} NFTs (${TOKENS_PER_ACCOUNT} per account)...`);
      
      // Process accounts sequentially to avoid transaction conflicts
      for (let i = 0; i < this.accounts.length; i++) {
        const account = this.accounts[i];
        const accountAddress = account.accountAddress.toString();
        
        console.log(`🎨 Minting for account ${i + 1}/${this.accounts.length}: ${accountAddress.slice(0, 8)}...`);
        
        // Initialize array for this account
        this.accountTokenMap[accountAddress] = [];
        
        // Mint multiple NFTs per account using unique token names
        for (let j = 0; j < TOKENS_PER_ACCOUNT; j++) {
          // Create unique token name per account to avoid conflicts
          const tokenName = `TestNFT_${accountAddress.slice(0, 8)}_${String.fromCharCode(65 + (j % 26))}${Math.floor(j / 26) + 1}`;
          const tokenUri = `https://example.com/metadata/${tokenName}.json`;
          
          try {
            const tokenId = await this.mintNFT(account, tokenName, tokenUri);
            
            // Check if this token is already in our list
            const existingNFT = this.mintedNFTs.find(nft => nft.tokenId === tokenId);
            if (!existingNFT) {
              this.mintedNFTs.push({
                tokenId,
                ownerAddress: accountAddress,
                tokenName,
                tokenUri,
                listed: false,
              });
            }
            
            this.metrics.mintedTokens++;
            
            // Show progress every 10 tokens
            if ((j + 1) % 10 === 0) {
              console.log(`✅ Processed ${j + 1}/${TOKENS_PER_ACCOUNT} tokens for ${accountAddress.slice(0, 8)}`);
            }
            
            // Shorter delay between tokens for faster minting
            const delay = Math.random() * 200 + 100; // 0.1-0.3 seconds
            await new Promise(resolve => setTimeout(resolve, delay));
          } catch (error) {
            this.metrics.mintFailures++;
            console.error(`❌ Failed to process NFT ${tokenName} for ${accountAddress}:`, error);
            
            // Continue with next token instead of stopping
            console.log(`⏭️  Continuing with next token...`);
            
            // Shorter delay on failure
            const delay = Math.random() * 1000 + 500; // 0.5-1.5 seconds
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        // Shorter delay between accounts
        if (i < this.accounts.length - 1) {
          const delay = Math.random() * 1000 + 500; // 0.5-1.5 seconds
          console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next account...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      console.log(`✅ Minting complete: ${this.metrics.mintedTokens} successful, ${this.metrics.mintFailures} failed`);
    }
  
    private async mintNFT(account: Ed25519Account, tokenName: string, tokenUri: string): Promise<string> {
      const maxRetries = 3;
      let lastError: any;
      
      // Get account-specific collection name
      const accountAddress = account.accountAddress.toString();
      const collectionName = `${COLLECTION_NAME}_${accountAddress.slice(0, 8)}`;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // TODO: Replace with your specific minting entry function
          // Example: `${YOUR_CONTRACT_ADDRESS}::your_module::your_mint_function`
          const transaction = await this.aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
              function: `${MARKETPLACE_ADDRESS}::create_nft::mint_test_nft_to_self`,
              functionArguments: [
                collectionName,
                tokenName,
              ],
            },
          });

          const pendingTransaction = await this.aptos.signAndSubmitTransaction({
            signer: account,
            transaction,
          });

          await this.aptos.waitForTransaction({
            transactionHash: pendingTransaction.hash,
            options: { checkSuccess: true },
          });

          // Get the actual token ID using view function
          const tokenId = await this.getTokenIdForAccount(account.accountAddress.toString(), tokenName);
          
          // Store in account token map
          this.accountTokenMap[account.accountAddress.toString()].push(tokenId);

          return tokenId;
        } catch (error) {
          lastError = error;
          
          // Check if token already exists
          if (error instanceof Error && (
            error.message.includes("token already exists") ||
            error.message.includes("already minted") ||
            error.message.includes("duplicate")
          )) {
            console.log(`ℹ️  Token ${tokenName} already exists for ${accountAddress}, skipping...`);
             
            // Try to get the existing token ID
            try {
              const tokenId = await this.getTokenIdForAccount(account.accountAddress.toString(), tokenName);
              this.accountTokenMap[account.accountAddress.toString()].push(tokenId);
              return tokenId;
            } catch (viewError) {
              console.warn(`⚠️  Could not get token ID for existing token ${tokenName}:`, viewError);
              // Return a fallback token ID
              return `existing_${accountAddress}_${collectionName}_${tokenName}`;
            }
          }
          
          console.warn(`⚠️  Mint attempt ${attempt}/${maxRetries} failed for ${tokenName}:`, error);
          
          if (attempt < maxRetries) {
            // Exponential backoff: 2^attempt seconds
            const backoffDelay = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Retrying in ${backoffDelay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      throw lastError;
    }
  
    private async getTokenIdForAccount(accountAddress: string, tokenName: string): Promise<string> {
      // Get account-specific collection name
      const collectionName = `${COLLECTION_NAME}_${accountAddress.slice(0, 8)}`;
      
      // TODO: Replace with your view function to get token ID for an account
      // Example: `${YOUR_CONTRACT_ADDRESS}::your_module::get_token_id`
      try {
        const result = await this.aptos.view({
          payload: {
            function: `${MARKETPLACE_ADDRESS}::create_nft::get_token_address`,
            functionArguments: [accountAddress, collectionName, tokenName],
          },
        });
        
        return result[0] as string;
      } catch (error) {
        console.error(`Failed to get token ID for account ${accountAddress}, collection ${collectionName}, token ${tokenName}:`, error);
        // Fallback to using a generated token ID
        return `fallback_${accountAddress}_${collectionName}_${tokenName}_${Date.now()}`;
      }
    }
  
    async saveNFTsToCache(): Promise<void> {
      await fs.writeFile(NFTS_CACHE_FILE, JSON.stringify(this.mintedNFTs, null, 2));
      console.log(`💾 Saved ${this.mintedNFTs.length} NFTs to cache`);
    }
  
    async saveAccountTokenMapToCache(): Promise<void> {
      await fs.writeFile(ACCOUNT_TOKEN_MAP_CACHE_FILE, JSON.stringify(this.accountTokenMap));
      console.log(`💾 Saved account token map with ${Object.keys(this.accountTokenMap).length} entries to cache`);
    }
  
    private async recoverExistingTokenIds(): Promise<void> {
      console.log("🔍 Recovering existing token IDs for first 200 accounts...");
      
      // Only process first 200 accounts that you know have minted successfully
      const accountsToProcess = this.accounts.slice(0, 200);
      console.log(`🎯 Processing ${accountsToProcess.length} accounts (50 tokens each)`);
      
      // Process accounts sequentially to avoid overwhelming the network
      for (let i = 0; i < accountsToProcess.length; i++) {
        const account = accountsToProcess[i];
        const accountAddress = account.accountAddress.toString();
        
        console.log(`🔍 Checking account ${i + 1}/${accountsToProcess.length}: ${accountAddress.slice(0, 8)}...`);
        
        // Initialize array for this account
        this.accountTokenMap[accountAddress] = [];
        
        // Check for existing tokens (50 per account)
        for (let j = 0; j < TOKENS_PER_ACCOUNT; j++) {
          const tokenName = `TestNFT_${accountAddress.slice(0, 8)}_${String.fromCharCode(65 + (j % 26))}${Math.floor(j / 26) + 1}`;
          
          try {
            // Try to get token ID for this token
            const tokenId = await this.getTokenIdForAccount(accountAddress, tokenName);
            
            // If we get a token ID, it means the token exists
            this.accountTokenMap[accountAddress].push(tokenId);
            
            // Add to minted NFTs list
            this.mintedNFTs.push({
              tokenId,
              ownerAddress: accountAddress,
              tokenName,
              tokenUri: `https://example.com/metadata/${tokenName}.json`,
              listed: false,
            });
            
            this.metrics.mintedTokens++;
            
            // Show progress every 10 tokens
            if ((j + 1) % 10 === 0) {
              console.log(`✅ Found ${j + 1}/${TOKENS_PER_ACCOUNT} tokens for ${accountAddress.slice(0, 8)}`);
            }
            
          } catch (error) {
            // Token doesn't exist, log it but continue
            console.log(`⚠️  Token ${tokenName} not found for ${accountAddress.slice(0, 8)}:`, error);
            this.metrics.mintFailures++;
          }
          
          // Small delay to avoid overwhelming the network
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Save progress after each account
        await this.saveNFTsToCache();
        await this.saveAccountTokenMapToCache();
        
        console.log(`✅ Account ${accountAddress.slice(0, 8)}: found ${this.accountTokenMap[accountAddress].length} tokens`);
        
        // Small delay between accounts
        if (i < accountsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`✅ Recovery complete: ${this.metrics.mintedTokens} tokens found, ${this.metrics.mintFailures} missing`);
    }
  
    // Public method to recover token IDs
    async recoverTokenIds(): Promise<void> {
      console.log("🔍 Starting token ID recovery for existing NFTs...");
      await this.recoverExistingTokenIds();
      console.log("✅ Token ID recovery complete!");
    }
  
    private createWorkers(): void {
      console.log("🔧 Creating transaction workers...");
      
      this.workers = this.accounts.map(account => 
        new NewTransactionWorker({
          account,
          aptosConfig: this.aptos.config,
          maxPendingResponses: MAX_CONCURRENT_TRANSACTIONS,
          pollInterval: 500,
          defaultOptions: {
            maxGasAmount: 2000,
            gasUnitPrice: 100,
          },
        })
      );
      
      console.log(`✅ Created ${this.workers.length} transaction workers`);
    }
  
    async runLoadTest(): Promise<void> {
      console.log("\n🚀 Starting Marketplace Load Test...");
      console.log(`📊 Test Configuration:`);
      console.log(`   - Accounts: ${this.accounts.length}`);
      console.log(`   - Tokens per account: ${TOKENS_PER_ACCOUNT}`);
      console.log(`   - Total tokens: ${this.accounts.length * TOKENS_PER_ACCOUNT}`);
      console.log(`   - Max concurrent transactions: ${MAX_CONCURRENT_TRANSACTIONS}`);
      console.log(`   - Test duration: ${TEST_DURATION_SECONDS} seconds`);
      console.log(`   - Status reports: every ${STATUS_REPORT_INTERVAL_SECONDS} seconds\n`);

      const startTime = Date.now();
      const endTime = startTime + (TEST_DURATION_SECONDS * 1000);

      // Start all workers
      const workerPromises = this.workers.map(worker => worker.start());
      
      // Set up status reporting
      const statusInterval = setInterval(() => {
        this.printStatusReport(startTime);
      }, STATUS_REPORT_INTERVAL_SECONDS * 1000);

      try {
        // Main load test loop - follow the pattern you showed
        await Promise.allSettled(
          this.workers.map(async (worker) => {
            while (Date.now() < endTime) {
              await this.submitRandomTransactionForWorker(worker);
              const delay = Math.random() * 400 + 100; // 0.1-0.5 seconds instead of 0.5-2
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          })
        );

        console.log("\n⏹️  Test duration reached, stopping workers...");
      } finally {
        clearInterval(statusInterval);
        
        // Stop all workers
        this.workers.forEach(worker => worker.stop());
        
        // Wait for workers to finish
        await Promise.allSettled(workerPromises);
      }

      // Final results
      this.printFinalResults(startTime);
    }

    private async submitRandomTransactionForWorker(worker: NewTransactionWorker): Promise<void> {
      const accountAddress = worker.account.accountAddress.toString();
      const accountTokens = this.accountTokenMap[accountAddress] || [];
      
      if (accountTokens.length === 0) {
        return; // No tokens for this account
      }
      
      // Find unlisted tokens for this account
      const unlistedTokens = accountTokens.filter(tokenId => {
        const nft = this.mintedNFTs.find(n => n.tokenId === tokenId);
        return nft && !nft.listed;
      });
      
      if (unlistedTokens.length === 0) {
        return; // No unlisted tokens for this account
      }
      
      // Pick a random unlisted token
      const tokenId = unlistedTokens[Math.floor(Math.random() * unlistedTokens.length)];
      
      try {
        await this.createListing(worker, tokenId);
        
        // Mark this token as listed
        const nft = this.mintedNFTs.find(n => n.tokenId === tokenId);
        if (nft) {
          nft.listed = true;
        }
        this.metrics.listingsCreated++;
        this.metrics.totalTransactions++;
      } catch (error) {
        this.metrics.listingFailures++;
        this.metrics.totalTransactions++;
        console.error(`❌ Listing failed for token ${tokenId}:`, error);
      }
    }

    private async createListing(worker: NewTransactionWorker, tokenId: string): Promise<void> {
      const listingPrice = Math.floor(Math.random() * 10000) + 100; // 0.001-0.001 APT
      
      const transaction: InputGenerateTransactionPayloadData = {
        function: `${MARKETPLACE_ADDRESS}::marketplace::place_listing`,
        functionArguments: [
          tokenId,
          FEE_SCHEDULE,
          "0xa", // aptcoin type
          listingPrice,
        ],
      };

      await worker.push(transaction);
    }

    private printStatusReport(startTime: number): void {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = TEST_DURATION_SECONDS - elapsed;
      const tps = elapsed > 0 ? this.metrics.totalTransactions / elapsed : 0;
      
      const listedNFTs = this.mintedNFTs.filter(nft => nft.listed).length;
      const availableNFTs = this.mintedNFTs.filter(nft => !nft.listed).length;
      const accountsWithTokens = Object.keys(this.accountTokenMap).length;
      const totalTokens = Object.values(this.accountTokenMap).reduce((sum, tokens) => sum + tokens.length, 0);
      const listingProgress = totalTokens > 0 ? ((listedNFTs / totalTokens) * 100).toFixed(1) : "0";

      console.log("\n" + "=".repeat(60));
      console.log("📊 MARKETPLACE LOAD TEST STATUS");
      console.log("=".repeat(60));
      console.log(`⏱️  Elapsed: ${elapsed.toFixed(1)}s / ${TEST_DURATION_SECONDS}s (${remaining.toFixed(1)}s remaining)`);
      console.log(`📈 Total Transactions: ${this.metrics.totalTransactions}`);
      console.log(`🎨 Minted NFTs: ${this.metrics.mintedTokens}`);
      console.log(`📋 Listings Created: ${this.metrics.listingsCreated}`);
      console.log(`👤 Accounts with Tokens: ${accountsWithTokens}`);
      console.log(`🎯 Total Tokens: ${totalTokens}`);
      console.log(`✅ Available NFTs: ${availableNFTs}`);
      console.log(`📊 Listed NFTs: ${listedNFTs} (${listingProgress}%)`);
      console.log(`❌ Mint Failures: ${this.metrics.mintFailures}`);
      console.log(`❌ Listing Failures: ${this.metrics.listingFailures}`);
      console.log(`🚀 Current TPS: ${tps.toFixed(2)}`);
      console.log("=".repeat(60));
    }

    private printFinalResults(startTime: number): void {
      const totalTime = (Date.now() - startTime) / 1000;
      const totalAttempts = this.metrics.totalTransactions + this.metrics.mintFailures + this.metrics.listingFailures;
      const successRate = totalAttempts > 0 ? (this.metrics.totalTransactions / totalAttempts) * 100 : 0;
      const averageTPS = totalTime > 0 ? this.metrics.totalTransactions / totalTime : 0;

      console.log("\n" + "🎯".repeat(20));
      console.log("FINAL LOAD TEST RESULTS");
      console.log("🎯".repeat(20));
      console.log(`⏱️  Total Test Time: ${totalTime.toFixed(2)} seconds`);
      console.log(`📊 Total Transactions: ${this.metrics.totalTransactions}`);
      console.log(`🎨 NFTs Minted: ${this.metrics.mintedTokens}`);
      console.log(`📋 Listings Created: ${this.metrics.listingsCreated}`);
      console.log(`❌ Mint Failures: ${this.metrics.mintFailures}`);
      console.log(`❌ Listing Failures: ${this.metrics.listingFailures}`);
      console.log(`📈 Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`🚀 Average TPS: ${averageTPS.toFixed(2)}`);
      console.log(`💾 NFTs in Cache: ${this.mintedNFTs.length}`);
      console.log("🎯".repeat(20));
    }
  }

  // Add signal handlers for graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, saving progress before exit...');
    if (global.tester) {
      await global.tester.saveNFTsToCache();
      await global.tester.saveAccountTokenMapToCache();
    }
    console.log('💾 Progress saved, exiting...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, saving progress before exit...');
    if (global.tester) {
      await global.tester.saveNFTsToCache();
      await global.tester.saveAccountTokenMapToCache();
    }
    console.log('💾 Progress saved, exiting...');
    process.exit(0);
  });

  (async () => {
    try {
      const tester = new MarketplaceLoadTester();
      global.tester = tester; // Store reference for signal handlers
      await tester.initialize();
      
      // Recovery is already done in initialize(), no need to call it again
      console.log("✅ Initialization and token recovery complete!");
      
      await tester.runLoadTest();
      process.exit(0);
    } catch (error) {
      console.error("Load test failed:", error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  })();
