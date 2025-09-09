import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  NumberInput,
  Select,
  TextInput,
  Textarea,
  FileInput,
  Image,
  Grid,
  Paper,
  Modal,
  Alert,
  Progress,
  ActionIcon,
  Tabs,
  Avatar,
  Divider,
  Slider,
  Switch
} from '@mantine/core';
import {
  IconPhoto,
  IconUpload,
  IconHammer,
  IconEye,
  IconHeart,
  IconShare,
  IconClock,
  IconTrophy,
  IconTag,
  IconPlus,
  IconX,
  IconCheck,
  IconStar,
  IconFilter,
  IconSearch,
  IconGridDots,
  IconList,
  IconRefresh
} from '@tabler/icons-react';

// === TYPES AND INTERFACES ===

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
  attributes: { trait_type: string; value: string | number }[];
  rarity?: number;
  views: number;
  likes: number;
  createdAt: number;
}

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
  reservePrice?: string;
}

interface Bid {
  id: string;
  bidder: string;
  amount: string;
  timestamp: number;
  txHash: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  items: number;
  floorPrice: string;
  volume: string;
  verified: boolean;
}

interface MintingFormData {
  name: string;
  description: string;
  image: File | null;
  attributes: { trait_type: string; value: string }[];
  royalty: number;
  supply: number;
  category: string;
  collection?: string;
}

// === IPFS METADATA RESOLVER ===

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
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
  ];

  async resolveMetadata(uri: string): Promise<IPFSMetadata> {
    if (this.cache.has(uri)) {
      return this.cache.get(uri)!;
    }

    for (const gateway of this.ipfsGateways) {
      try {
        const url = this.buildIPFSUrl(uri, gateway);
        const response = await fetch(url);
        const metadata = await response.json();
        
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

  async uploadToIPFS(file: File): Promise<string> {
    // Simulate IPFS upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    return 'QmYx7T9QjsyV3J8K6vE1p5QF2wR8u7N9M6dL4kG3hB5cA2';
  }

  async uploadMetadata(metadata: any): Promise<string> {
    // Simulate metadata upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'QmMetadata7T9QjsyV3J8K6vE1p5QF2wR8u7N9M6dL4kG3';
  }
}

// === NFT GALLERY COMPONENT ===

interface NFTGalleryProps {
  collection?: string;
  owner?: string;
  creator?: string;
  priceRange?: [number, number];
  sortBy?: 'price' | 'date' | 'name' | 'rarity';
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({
  collection,
  owner,
  creator,
  priceRange,
  sortBy = 'date'
}) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  useEffect(() => {
    // Generate mock NFT data
    const generateMockNFTs = (): NFT[] => {
      return Array.from({ length: 20 }, (_, i) => ({
        id: `nft-${i}`,
        tokenId: (i + 1).toString(),
        contract: '0x1234567890123456789012345678901234567890',
        owner: '0xOwner123456789012345678901234567890123456',
        creator: '0xCreator123456789012345678901234567890123',
        name: `Cosmic NFT #${i + 1}`,
        description: `A unique cosmic NFT with rare traits and stellar properties. This piece represents the ${i + 1}th star in our collection.`,
        image: `https://picsum.photos/400/400?random=${i}`,
        metadata: {},
        price: Math.random() > 0.3 ? (Math.random() * 10 + 0.1).toFixed(2) : undefined,
        lastSale: (Math.random() * 5).toFixed(2),
        isListed: Math.random() > 0.3,
        standard: Math.random() > 0.8 ? 'ERC1155' : 'ERC721',
        supply: Math.random() > 0.8 ? Math.floor(Math.random() * 100) + 1 : 1,
        royalty: Math.floor(Math.random() * 10) + 2.5,
        attributes: [
          { trait_type: 'Background', value: ['Blue', 'Red', 'Purple', 'Gold'][Math.floor(Math.random() * 4)] },
          { trait_type: 'Rarity', value: Math.floor(Math.random() * 100) + 1 },
          { trait_type: 'Power Level', value: Math.floor(Math.random() * 1000) + 100 }
        ],
        rarity: Math.random() * 100,
        views: Math.floor(Math.random() * 5000),
        likes: Math.floor(Math.random() * 500),
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      }));
    };

    setIsLoading(true);
    setTimeout(() => {
      const mockNFTs = generateMockNFTs();
      setNfts(mockNFTs);
      setFilteredNfts(mockNFTs);
      setIsLoading(false);
    }, 1500);
  }, []);

  // Filter and sort NFTs
  useEffect(() => {
    let filtered = [...nfts];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply price range filter
    if (priceRange) {
      filtered = filtered.filter(nft => {
        if (!nft.price) return false;
        const price = parseFloat(nft.price);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (parseFloat(b.price || '0')) - (parseFloat(a.price || '0'));
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          return (b.rarity || 0) - (a.rarity || 0);
        case 'date':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    setFilteredNfts(filtered);
  }, [nfts, searchTerm, priceRange, sortBy]);

  const handleLike = (nftId: string) => {
    setNfts(prev => prev.map(nft =>
      nft.id === nftId ? { ...nft, likes: nft.likes + 1 } : nft
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <Stack align="center" p="xl">
          <Progress value={30} animated style={{ width: '200px' }} />
          <Text c="dimmed">Loading NFTs...</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Stack>
          <Group justify="space-between">
            <Text fw={600}>NFT Gallery</Text>
            <Group gap="xs">
              <ActionIcon
                variant={viewMode === 'grid' ? 'filled' : 'subtle'}
                onClick={() => setViewMode('grid')}
              >
                <IconGridDots size={16} />
              </ActionIcon>
              <ActionIcon
                variant={viewMode === 'list' ? 'filled' : 'subtle'}
                onClick={() => setViewMode('list')}
              >
                <IconList size={16} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Search and Filters */}
          <Group>
            <TextInput
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Sort by"
              data={[
                { value: 'date', label: 'Recently Created' },
                { value: 'price', label: 'Price: High to Low' },
                { value: 'name', label: 'Name: A to Z' },
                { value: 'rarity', label: 'Rarity' }
              ]}
              value={sortBy}
              onChange={(value) => sortBy = value as any}
            />
          </Group>

          {/* NFT Grid/List */}
          {viewMode === 'grid' ? (
            <Grid>
              {filteredNfts.map((nft) => (
                <Grid.Col key={nft.id} span={12} sm={6} md={4} lg={3}>
                  <Card
                    withBorder
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedNFT(nft)}
                  >
                    <Stack gap="sm">
                      <Image
                        src={nft.image}
                        alt={nft.name}
                        h={250}
                        radius="sm"
                      />
                      
                      <Stack gap="xs">
                        <Text fw={500} lineClamp={1}>{nft.name}</Text>
                        <Group justify="space-between">
                          <Badge variant="light" size="sm">
                            {nft.standard}
                          </Badge>
                          {nft.price && (
                            <Text size="sm" fw={500} c="green">
                              {nft.price} ETH
                            </Text>
                          )}
                        </Group>
                        <Group justify="space-between">
                          <Group gap="xs">
                            <ActionIcon size="sm" variant="subtle" onClick={(e) => {
                              e.stopPropagation();
                              handleLike(nft.id);
                            }}>
                              <IconHeart size={14} />
                            </ActionIcon>
                            <Text size="xs">{nft.likes}</Text>
                          </Group>
                          <Group gap="xs">
                            <IconEye size={14} />
                            <Text size="xs">{nft.views}</Text>
                          </Group>
                        </Group>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <Stack gap="sm">
              {filteredNfts.map((nft) => (
                <Paper key={nft.id} withBorder p="md" style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNFT(nft)}>
                  <Group>
                    <Image src={nft.image} alt={nft.name} w={80} h={80} radius="sm" />
                    <div style={{ flex: 1 }}>
                      <Text fw={500}>{nft.name}</Text>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {nft.description}
                      </Text>
                      <Group gap="xs" mt="xs">
                        <Badge variant="light" size="sm">{nft.standard}</Badge>
                        <Text size="xs">#{nft.tokenId}</Text>
                      </Group>
                    </div>
                    <Stack align="center" gap="xs">
                      {nft.price && (
                        <Text size="lg" fw={500} c="green">
                          {nft.price} ETH
                        </Text>
                      )}
                      <Group gap="xs">
                        <Group gap={2}>
                          <IconHeart size={14} />
                          <Text size="xs">{nft.likes}</Text>
                        </Group>
                        <Group gap={2}>
                          <IconEye size={14} />
                          <Text size="xs">{nft.views}</Text>
                        </Group>
                      </Group>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>

      {/* NFT Detail Modal */}
      <Modal
        opened={selectedNFT !== null}
        onClose={() => setSelectedNFT(null)}
        size="xl"
        title={selectedNFT?.name}
      >
        {selectedNFT && (
          <Grid>
            <Grid.Col span={12} md={6}>
              <Image
                src={selectedNFT.image}
                alt={selectedNFT.name}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={12} md={6}>
              <Stack gap="md">
                <div>
                  <Text fw={500} size="lg">{selectedNFT.name}</Text>
                  <Text size="sm" c="dimmed">Token #{selectedNFT.tokenId}</Text>
                </div>
                
                <Text>{selectedNFT.description}</Text>
                
                {selectedNFT.price && (
                  <Paper withBorder p="md">
                    <Text size="sm" c="dimmed">Current Price</Text>
                    <Text size="xl" fw={700} c="green">
                      {selectedNFT.price} ETH
                    </Text>
                  </Paper>
                )}
                
                <div>
                  <Text size="sm" fw={500} mb="xs">Attributes</Text>
                  <Grid>
                    {selectedNFT.attributes.map((attr, index) => (
                      <Grid.Col key={index} span={6}>
                        <Paper withBorder p="xs" ta="center">
                          <Text size="xs" c="dimmed">{attr.trait_type}</Text>
                          <Text size="sm" fw={500}>{attr.value}</Text>
                        </Paper>
                      </Grid.Col>
                    ))}
                  </Grid>
                </div>
                
                <Group justify="space-between">
                  <Group gap="xs">
                    <ActionIcon color="red">
                      <IconHeart size={16} />
                    </ActionIcon>
                    <ActionIcon>
                      <IconShare size={16} />
                    </ActionIcon>
                  </Group>
                  {selectedNFT.isListed && (
                    <Button>Buy Now</Button>
                  )}
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        )}
      </Modal>
    </>
  );
};

// === MINTING INTERFACE COMPONENT ===

export const MintingInterface: React.FC = () => {
  const [formData, setFormData] = useState<MintingFormData>({
    name: '',
    description: '',
    image: null,
    attributes: [],
    royalty: 5,
    supply: 1,
    category: 'art',
    collection: undefined
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const metadataResolver = useMemo(() => new MetadataResolver(), []);

  const handleImageChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, image: file }));
    
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const mintNFT = async () => {
    if (!formData.image || !formData.name) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload image to IPFS
      setUploadProgress(30);
      const imageHash = await metadataResolver.uploadToIPFS(formData.image);
      
      // Create and upload metadata
      setUploadProgress(60);
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: `ipfs://${imageHash}`,
        attributes: formData.attributes.filter(attr => attr.trait_type && attr.value)
      };
      
      const metadataHash = await metadataResolver.uploadMetadata(metadata);
      
      // Simulate contract interaction
      setUploadProgress(90);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(100);
      
      // Reset form
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          image: null,
          attributes: [],
          royalty: 5,
          supply: 1,
          category: 'art',
          collection: undefined
        });
        setPreviewUrl('');
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Minting failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <Stack>
        <Text fw={600}>Create NFT</Text>
        
        {/* Image Upload */}
        <Stack gap="sm">
          <Text size="sm" fw={500}>Upload Image</Text>
          <FileInput
            accept="image/*"
            placeholder="Choose image file"
            value={formData.image}
            onChange={handleImageChange}
            leftSection={<IconUpload size={16} />}
            disabled={isUploading}
          />
          {previewUrl && (
            <Image src={previewUrl} alt="Preview" h={200} fit="contain" radius="md" />
          )}
        </Stack>

        {/* Basic Information */}
        <Grid>
          <Grid.Col span={12} md={6}>
            <TextInput
              label="Name"
              placeholder="NFT Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isUploading}
            />
          </Grid.Col>
          <Grid.Col span={12} md={6}>
            <Select
              label="Category"
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value! }))}
              data={[
                { value: 'art', label: 'Art' },
                { value: 'music', label: 'Music' },
                { value: 'gaming', label: 'Gaming' },
                { value: 'sports', label: 'Sports' },
                { value: 'collectibles', label: 'Collectibles' }
              ]}
              disabled={isUploading}
            />
          </Grid.Col>
        </Grid>

        <Textarea
          label="Description"
          placeholder="Describe your NFT"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          minRows={3}
          disabled={isUploading}
        />

        {/* NFT Settings */}
        <Grid>
          <Grid.Col span={12} md={6}>
            <NumberInput
              label="Royalty (%)"
              value={formData.royalty}
              onChange={(value) => setFormData(prev => ({ ...prev, royalty: value || 0 }))}
              min={0}
              max={20}
              step={0.5}
              disabled={isUploading}
            />
          </Grid.Col>
          <Grid.Col span={12} md={6}>
            <NumberInput
              label="Supply"
              value={formData.supply}
              onChange={(value) => setFormData(prev => ({ ...prev, supply: value || 1 }))}
              min={1}
              max={10000}
              disabled={isUploading}
            />
          </Grid.Col>
        </Grid>

        {/* Attributes */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Attributes</Text>
            <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} 
              onClick={addAttribute} disabled={isUploading}>
              Add Attribute
            </Button>
          </Group>
          
          {formData.attributes.map((attribute, index) => (
            <Group key={index} align="end">
              <TextInput
                placeholder="Trait type"
                value={attribute.trait_type}
                onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                style={{ flex: 1 }}
                disabled={isUploading}
              />
              <TextInput
                placeholder="Value"
                value={attribute.value}
                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                style={{ flex: 1 }}
                disabled={isUploading}
              />
              <ActionIcon color="red" onClick={() => removeAttribute(index)} disabled={isUploading}>
                <IconX size={16} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>

        {/* Upload Progress */}
        {isUploading && (
          <Stack gap="xs">
            <Progress value={uploadProgress} animated />
            <Text size="sm" c="dimmed" ta="center">
              {uploadProgress < 30 && 'Uploading image...'}
              {uploadProgress >= 30 && uploadProgress < 60 && 'Creating metadata...'}
              {uploadProgress >= 60 && uploadProgress < 90 && 'Minting NFT...'}
              {uploadProgress >= 90 && 'Almost done...'}
            </Text>
          </Stack>
        )}

        {/* Mint Button */}
        <Button
          onClick={mintNFT}
          disabled={!formData.image || !formData.name || isUploading}
          loading={isUploading}
          leftSection={<IconPhoto size={20} />}
          size="lg"
        >
          {isUploading ? 'Minting...' : 'Mint NFT'}
        </Button>

        {uploadProgress === 100 && (
          <Alert color="green" icon={<IconCheck />}>
            NFT minted successfully! It may take a few minutes to appear in your collection.
          </Alert>
        )}
      </Stack>
    </Card>
  );
};

// === AUCTION SYSTEM COMPONENT ===

export const AuctionSystem: React.FC<{ nftId: string }> = ({ nftId }) => {
  const [auction, setAuction] = useState<Auction>({
    id: 'auction-1',
    nftId,
    seller: '0xSeller123',
    startPrice: '1.0',
    currentBid: '2.5',
    highestBidder: '0xBidder456',
    startTime: Date.now() - 2 * 60 * 60 * 1000,
    endTime: Date.now() + 6 * 60 * 60 * 1000,
    status: 'active',
    bids: [
      {
        id: 'bid-1',
        bidder: '0xBidder123',
        amount: '1.5',
        timestamp: Date.now() - 60 * 60 * 1000,
        txHash: '0xabc123'
      },
      {
        id: 'bid-2',
        bidder: '0xBidder456',
        amount: '2.5',
        timestamp: Date.now() - 30 * 60 * 1000,
        txHash: '0xdef456'
      }
    ],
    reservePrice: '2.0'
  });

  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  // Update time remaining
  useEffect(() => {
    const updateTime = () => {
      const remaining = auction.endTime - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, [auction.endTime]);

  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Auction ended';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const calculateMinimumBid = (): number => {
    const current = parseFloat(auction.currentBid);
    return current + Math.max(current * 0.05, 0.1); // 5% minimum increase or 0.1 ETH
  };

  const placeBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) < calculateMinimumBid()) return;

    setIsPlacingBid(true);
    
    try {
      // Simulate bid transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBid: Bid = {
        id: `bid-${Date.now()}`,
        bidder: '0xCurrentUser',
        amount: bidAmount,
        timestamp: Date.now(),
        txHash: '0x' + Math.random().toString(16).substr(2, 64)
      };

      setAuction(prev => ({
        ...prev,
        currentBid: bidAmount,
        highestBidder: '0xCurrentUser',
        bids: [newBid, ...prev.bids]
      }));

      setBidAmount('');
    } catch (error) {
      console.error('Bid failed:', error);
    } finally {
      setIsPlacingBid(false);
    }
  };

  const minBid = calculateMinimumBid();

  return (
    <Card>
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>Live Auction</Text>
          <Badge color={timeRemaining > 0 ? 'green' : 'red'}>
            {timeRemaining > 0 ? 'Active' : 'Ended'}
          </Badge>
        </Group>

        {/* Auction Info */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Current Bid</Text>
              <Text size="xl" fw={700} c="green">
                {auction.currentBid} ETH
              </Text>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Time Remaining</Text>
              <Group gap="xs">
                <IconClock size={16} />
                <Text size="sm" fw={500}>
                  {formatTimeRemaining(timeRemaining)}
                </Text>
              </Group>
            </Group>

            {auction.reservePrice && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Reserve Price</Text>
                <Text size="sm" fw={500}>
                  {auction.reservePrice} ETH
                  {parseFloat(auction.currentBid) >= parseFloat(auction.reservePrice) && (
                    <IconCheck size={14} color="green" style={{ marginLeft: 4 }} />
                  )}
                </Text>
              </Group>
            )}
          </Stack>
        </Paper>

        {/* Place Bid */}
        {timeRemaining > 0 && (
          <Stack gap="sm">
            <Text size="sm" fw={500}>Place a Bid</Text>
            <Group>
              <NumberInput
                placeholder={`Min: ${minBid.toFixed(2)} ETH`}
                value={bidAmount}
                onChange={(value) => setBidAmount(value?.toString() || '')}
                min={minBid}
                step={0.1}
                suffix=" ETH"
                style={{ flex: 1 }}
                disabled={isPlacingBid}
              />
              <Button
                onClick={placeBid}
                disabled={!bidAmount || parseFloat(bidAmount) < minBid || isPlacingBid}
                loading={isPlacingBid}
                leftSection={<IconHammer size={16} />}
              >
                Bid
              </Button>
            </Group>
            <Text size="xs" c="dimmed">
              Minimum bid: {minBid.toFixed(2)} ETH
            </Text>
          </Stack>
        )}

        {/* Bid History */}
        <Stack gap="sm">
          <Text size="sm" fw={500}>Bid History</Text>
          <Stack gap="xs">
            {auction.bids.slice(0, 5).map((bid) => (
              <Paper key={bid.id} withBorder p="xs">
                <Group justify="space-between">
                  <Group gap="xs">
                    <Avatar size="sm" color="blue">
                      {bid.bidder.slice(2, 4).toUpperCase()}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>
                        {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(bid.timestamp).toLocaleString()}
                      </Text>
                    </div>
                  </Group>
                  <Text size="sm" fw={500}>
                    {bid.amount} ETH
                  </Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

// === MAIN COMPONENT ===

export default function NFTMarketplaceDevelopment() {
  const [activeTab, setActiveTab] = useState('gallery');

  return (
    <Stack gap="lg">
      <Text size="xl" fw={700}>NFT Marketplace</Text>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value!)}>
        <Tabs.List>
          <Tabs.Tab value="gallery" leftSection={<IconPhoto size={16} />}>
            Gallery
          </Tabs.Tab>
          <Tabs.Tab value="mint" leftSection={<IconUpload size={16} />}>
            Create NFT
          </Tabs.Tab>
          <Tabs.Tab value="auction" leftSection={<IconHammer size={16} />}>
            Auctions
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="gallery" pt="lg">
          <NFTGallery sortBy="date" />
        </Tabs.Panel>

        <Tabs.Panel value="mint" pt="lg">
          <MintingInterface />
        </Tabs.Panel>

        <Tabs.Panel value="auction" pt="lg">
          <AuctionSystem nftId="nft-1" />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}