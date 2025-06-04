# API Key Authentication Setup

This guide explains how to set up API key authentication for Aptos API requests to avoid rate limiting.

## Setup Instructions

### 1. Create Environment File

Create a `.env.local` file in your project root with network-specific API keys:

```bash
# Aptos API Configuration - Network Specific
VITE_APTOS_API_KEY_MAINNET=your_mainnet_api_key_here
VITE_APTOS_API_KEY_TESTNET=your_testnet_api_key_here
VITE_APTOS_API_KEY_DEVNET=your_devnet_api_key_here

# Fallback API key (used when network-specific key is not available)
VITE_APTOS_API_KEY=your_default_api_key_here
```

**Important Notes:**
- Replace the placeholder values with your actual Aptos API keys
- The `VITE_` prefix is required for Vite to make this available in the client
- Network-specific keys take priority over the fallback key
- The `.env.local` file is already ignored by git (see `.gitignore`)

### 2. Get Your API Keys

1. Visit the [Aptos Labs API Console](https://developers.aptoslabs.com/)
2. Sign up or log in to your account
3. Create separate API keys for each network you plan to use:
   - Mainnet API key for production
   - Testnet API key for testing
   - Devnet API key for development
4. Copy each API key to the corresponding environment variable

### 3. How It Works

The authentication is automatically handled by the `getAuthHeaders()` function in `src/lib/api.ts`:

```typescript
function getAuthHeaders(network?: Network): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Map network to appropriate environment variable
  let apiKey: string | undefined;
  
  if (network) {
    switch (network) {
      case Network.MAINNET:
        apiKey = import.meta.env.VITE_APTOS_API_KEY_MAINNET || import.meta.env.VITE_APTOS_API_KEY;
        break;
      case Network.TESTNET:
        apiKey = import.meta.env.VITE_APTOS_API_KEY_TESTNET;
        break;
      case Network.DEVNET:
        apiKey = import.meta.env.VITE_APTOS_API_KEY_DEVNET;
        break;
      default:
        apiKey = import.meta.env.VITE_APTOS_API_KEY;
        break;
    }
  } else {
    // Fallback to default API key
    apiKey = import.meta.env.VITE_APTOS_API_KEY;
  }

  // Add Authorization header if API key is available
  if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
}
```

### 4. Network Mapping

The system automatically selects the appropriate API key based on the network:

| Network | Environment Variable | Fallback |
|---------|---------------------|----------|
| **Mainnet** | `VITE_APTOS_API_KEY_MAINNET` | `VITE_APTOS_API_KEY` |
| **Testnet** | `VITE_APTOS_API_KEY_TESTNET` | - |
| **Devnet** | `VITE_APTOS_API_KEY_DEVNET` | - |
| **Default** | `VITE_APTOS_API_KEY` | - |

### 5. Usage Examples

All GraphQL requests will automatically include the correct Authorization header for the specified network:

```bash
# Mainnet request
curl -X POST https://api.mainnet.aptoslabs.com/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_mainnet_api_key" \
  -d '{"query": "..."}'

# Testnet request  
curl -X POST https://api.testnet.aptoslabs.com/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_testnet_api_key" \
  -d '{"query": "..."}'
```

### 6. Benefits

- **Network Isolation**: Different API keys for different environments
- **Rate Limiting**: Avoid hitting API rate limits on each network
- **Better Performance**: Higher request quotas with authenticated requests
- **Reliability**: More stable API access for production applications
- **Security**: Separate keys allow for better access control

### 7. Security Best Practices

✅ **DO:**
- Keep API keys in `.env.local` (already gitignored)
- Use different API keys for each network
- Use separate keys for development, staging, and production
- Regenerate keys if compromised
- Set appropriate rate limits for each key

❌ **DON'T:**
- Commit API keys to version control
- Share API keys in public channels  
- Use production keys in development
- Use the same key across all networks

### 8. Troubleshooting

If you're still getting rate limited:

1. **Check API Key Configuration:**
   ```bash
   # Add this temporarily to see which key is being used
   console.log("authHeaders", authHeaders);
   ```

2. **Verify Environment Variables:**
   - Restart your development server after adding environment variables
   - Check that the correct network-specific variable is set
   - Ensure no typos in variable names

3. **Check Network Detection:**
   - Verify the correct network is being passed to API functions
   - Check browser's Network tab to confirm the Authorization header

4. **API Key Limits:**
   - Ensure your API key has sufficient quota limits
   - Check the Aptos developer console for usage statistics

## Environment Variables Reference

| Variable | Description | Required | Notes |
|----------|-------------|----------|-------|
| `VITE_APTOS_API_KEY_MAINNET` | Mainnet API key | Recommended | Falls back to `VITE_APTOS_API_KEY` |
| `VITE_APTOS_API_KEY_TESTNET` | Testnet API key | Optional | For testing environments |
| `VITE_APTOS_API_KEY_DEVNET` | Devnet API key | Optional | For development |
| `VITE_APTOS_API_KEY` | Fallback API key | Yes | Used when network-specific key unavailable |

## Example `.env.local`

```bash
# Production Mainnet
VITE_APTOS_API_KEY_MAINNET=aptos_sk_1234567890abcdef_mainnet

# Testing Environment  
VITE_APTOS_API_KEY_TESTNET=aptos_sk_0987654321fedcba_testnet

# Development Environment
VITE_APTOS_API_KEY_DEVNET=aptos_sk_1357924680acebd_devnet

# Fallback key (required)
VITE_APTOS_API_KEY=aptos_sk_1111222233334444_fallback

# Other environment variables
# VITE_DEFAULT_NETWORK=mainnet
```

## Quick Setup for Single Network

If you only need to support one network (e.g., mainnet), you can just set the fallback key:

```bash
# Simple setup for mainnet only
VITE_APTOS_API_KEY=your_mainnet_api_key_here
``` 
