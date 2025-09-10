# Exercise 06: NFT Marketplace Development

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Build comprehensive NFT marketplace interfaces** with gallery views and detailed NFT displays
2. **Implement NFT minting workflows** with IPFS integration and metadata management
3. **Create auction and marketplace systems** with bidding, offers, and secondary sales
4. **Handle ERC-721 and ERC-1155 standards** for both single and batch NFT operations
5. **Integrate IPFS for decentralized storage** with image optimization and metadata resolution

## 📋 Pre-requisites

Before starting this exercise, you should have completed:

- Exercise 01: Web3 Wallet Integration
- Exercise 02: Blockchain Data Fetching
- Exercise 03: Smart Contract Interaction
- Understanding of NFT standards (ERC-721, ERC-1155)
- Basic knowledge of IPFS and decentralized storage
- Familiarity with image handling and optimization

## 📚 Introduction

NFT marketplaces are complex applications that combine smart contract interactions, decentralized storage, real-time bidding, and rich media handling. This exercise teaches you to build production-ready NFT marketplace features with proper metadata handling, efficient image loading, auction mechanics, and comprehensive marketplace functionality.

## 🛠️ Setup

You'll implement a comprehensive NFT marketplace system:

### Core Components

1. **NFTGallery**: Grid and list views with filtering and searching
2. **MintingInterface**: NFT creation with metadata and IPFS upload
3. **AuctionSystem**: Timed auctions with real-time bidding
4. **MetadataResolver**: IPFS integration and metadata caching

### Key Features

- ERC-721 and ERC-1155 support
- IPFS integration for decentralized storage
- Real-time auction bidding
- Lazy minting optimization
- Royalty calculations and distribution
- Batch operations for collections

## 📝 Instructions

### Step 1: Implement NFTGallery Component

Create a responsive NFT gallery with filtering and search:

```typescript
interface NFT {
  id: string;
  tokenId: string;
  contract: string;
  owner: string;
  creator: string;
  name: string;
  description: string;
  image: string;
  metadata: any;
  price?: string;
  lastSale?: string;
  isListed: boolean;
  standard: 'ERC721' | 'ERC1155';
  supply?: number;
  royalty?: number;
}

interface NFTGalleryProps {
  collection?: string;
  owner?: string;
  creator?: string;
  priceRange?: [number, number];
  sortBy: 'price' | 'date' | 'name';
}

const NFTGallery: React.FC<NFTGalleryProps> = ({
  collection,
  owner,
  creator,
  priceRange,
  sortBy
}) => {
  // Implement gallery view with filtering
  // Add search functionality
  // Support grid and list views
  // Implement infinite scroll loading
};
```

Key implementation points:
- Responsive grid layout with proper aspect ratios
- Advanced filtering by price, collection, traits
- Search functionality across names and descriptions
- Lazy loading for images and metadata
- Virtual scrolling for large collections

### Step 2: Build MintingInterface

Create NFT minting with IPFS integration:

```typescript
interface MintingFormData {
  name: string;
  description: string;
  image: File;
  attributes: { trait_type: string; value: string }[];
  royalty: number;
  supply: number;
  category: string;
}

const MintingInterface: React.FC = () => {
  const [formData, setFormData] = useState<MintingFormData>({
    name: '',
    description: '',
    image: null,
    attributes: [],
    royalty: 0,
    supply: 1,
    category: 'art'
  });
  
  const uploadToIPFS = async (file: File): Promise<string> => {
    // Upload image to IPFS
    // Return IPFS hash
  };
  
  const createMetadata = async (): Promise<string> => {
    // Create NFT metadata following standards
    // Upload metadata to IPFS
    // Return metadata URI
  };
  
  const mintNFT = async () => {
    // Upload image and metadata
    // Call smart contract mint function
    // Handle lazy minting if available
  };
};
```

### Step 3: Create AuctionSystem

Implement timed auctions with real-time bidding:

```typescript
interface Auction {
  id: string;
  nftId: string;
  seller: string;
  startPrice: string;
  currentBid: string;
  highestBidder: string;
  startTime: number;
  endTime: number;
  status: 'active' | 'ended' | 'cancelled';
  bids: Bid[];
}

interface Bid {
  bidder: string;
  amount: string;
  timestamp: number;
  txHash: string;
}

const AuctionSystem: React.FC<{ nftId: string }> = ({ nftId }) => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const placeBid = async () => {
    // Validate bid amount
    // Call auction contract
    // Update UI optimistically
  };
  
  const endAuction = async () => {
    // Finalize auction
    // Transfer NFT to winner
    // Handle payments and royalties
  };
};
```

### Step 4: Build MetadataResolver

Handle IPFS integration and metadata caching:

```typescript
interface IPFSMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
    display_type?: string;
  }[];
  animation_url?: string;
  external_url?: string;
}

class MetadataResolver {
  private cache: Map<string, IPFSMetadata> = new Map();
  private ipfsGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/'
  ];
  
  async resolveMetadata(uri: string): Promise<IPFSMetadata> {
    // Check cache first
    if (this.cache.has(uri)) {
      return this.cache.get(uri)!;
    }
    
    // Try multiple IPFS gateways
    for (const gateway of this.ipfsGateways) {
      try {
        const response = await fetch(this.buildIPFSUrl(uri, gateway));
        const metadata = await response.json();
        
        // Cache successful result
        this.cache.set(uri, metadata);
        return metadata;
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}:`, error);
        continue;
      }
    }
    
    throw new Error('Failed to resolve metadata from all gateways');
  }
  
  private buildIPFSUrl(uri: string, gateway: string): string {
    if (uri.startsWith('ipfs://')) {
      return gateway + uri.replace('ipfs://', '');
    }
    return uri;
  }
}
```

## 💡 Hints

### IPFS Integration

```typescript
// Using Pinata for IPFS uploads
const uploadToPinata = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`
    },
    body: formData
  });
  
  const result = await response.json();
  return result.IpfsHash;
};

// Image optimization for NFTs
const optimizeImage = async (file: File): Promise<File> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      // Resize to optimal dimensions
      const maxSize = 1024;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

### Auction Mechanics

```typescript
const calculateMinimumBid = (currentBid: string, increment: number = 5): string => {
  const current = parseFloat(currentBid);
  const minIncrement = current * (increment / 100);
  return (current + minIncrement).toFixed(6);
};

const formatTimeRemaining = (endTime: number): string => {
  const now = Date.now();
  const remaining = endTime - now;
  
  if (remaining <= 0) return 'Auction ended';
  
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
```

### Lazy Minting Implementation

```typescript
const createLazyMintSignature = async (
  nft: {
    tokenId: string;
    uri: string;
    creator: string;
    royalty: number;
  },
  signer: any
): Promise<string> => {
  const domain = {
    name: 'LazyNFT',
    version: '1',
    chainId: 1,
    verifyingContract: CONTRACT_ADDRESS
  };
  
  const types = {
    LazyNFT: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'uri', type: 'string' },
      { name: 'creator', type: 'address' },
      { name: 'royalty', type: 'uint96' }
    ]
  };
  
  return signer._signTypedData(domain, types, nft);
};
```

## 🎓 Learning Notes

### NFT Standards Best Practices

1. **ERC-721**: Use for unique, non-fungible tokens
2. **ERC-1155**: Use for semi-fungible tokens and collections
3. **Metadata Standards**: Follow OpenSea and other marketplace standards
4. **Royalty Standards**: Implement EIP-2981 for automatic royalties
5. **Batch Operations**: Optimize gas costs with batch minting/transfers

### IPFS Optimization Strategies

1. **Pin Important Content**: Use pinning services for persistence
2. **Multiple Gateways**: Implement fallback gateway rotation
3. **Content Addressing**: Use IPFS hashes for immutable references
4. **Image Optimization**: Compress images without quality loss
5. **Metadata Caching**: Cache resolved metadata locally

### Marketplace Security

```typescript
// Always validate NFT ownership before operations
const validateOwnership = async (tokenId: string, userAddress: string): Promise<boolean> => {
  const owner = await nftContract.ownerOf(tokenId);
  return owner.toLowerCase() === userAddress.toLowerCase();
};

// Implement proper approval checks
const checkApproval = async (tokenId: string, marketplaceAddress: string): Promise<boolean> => {
  const approved = await nftContract.getApproved(tokenId);
  const isApprovedForAll = await nftContract.isApprovedForAll(owner, marketplaceAddress);
  
  return approved === marketplaceAddress || isApprovedForAll;
};
```

## 🔍 Debugging Tips

1. **IPFS Gateway Issues**: Test multiple gateways for reliability
2. **Metadata Validation**: Validate JSON structure before display
3. **Image Loading**: Implement progressive loading with placeholders
4. **Contract Interactions**: Test with small amounts first
5. **Auction Timing**: Account for block time variations

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] NFT gallery displays correctly with all view modes
- [ ] Minting workflow completes successfully
- [ ] IPFS integration works with multiple gateways
- [ ] Auction system handles bidding correctly
- [ ] Metadata resolution is cached and optimized
- [ ] Image optimization reduces file sizes
- [ ] Royalty calculations are accurate
- [ ] Error handling covers all edge cases
- [ ] Loading states provide good user experience
- [ ] Responsive design works on all devices

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **Collection Management**: Create and manage NFT collections
2. **Bulk Operations**: Implement batch minting and transfers
3. **Advanced Search**: Add trait-based filtering and rarity rankings
4. **Social Features**: Add likes, comments, and sharing
5. **Analytics Dashboard**: Track collection performance and trends

## 📚 Resources

- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Pinata IPFS Service](https://docs.pinata.cloud/)
- [NFT Storage](https://nft.storage/) - Free IPFS storage for NFTs
- [EIP-2981 Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)