// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title HydrogenMarketplace
 * @dev A marketplace contract for minting and selling Green Hydrogen Credit NFTs
 */
contract HydrogenMarketplace is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    // Token ID counter
    Counters.Counter private _tokenIdCounter;
    
    // Verifier address - only this address can mint new credits
    address public verifierAddress;
    
    // Listing structure for marketplace
    struct Listing {
        address payable producer;
        uint256 price;
        bool isActive;
    }
    
    // Mapping from token ID to listing details
    mapping(uint256 => Listing) public listings;
    
    // Array to track all token IDs for easy iteration
    uint256[] private _allTokenIds;
    
    // Events
    event VerifierSet(address indexed newVerifier);
    event CreditListed(uint256 indexed tokenId, address indexed producer, uint256 price);
    event CreditSold(uint256 indexed tokenId, address indexed buyer, address indexed producer);
    
    constructor() ERC721("Green Hydrogen Credit", "GHC") {}
    
    /**
     * @dev Set the verifier address (only owner can call)
     * @param _verifierAddress The address of the verifier
     */
    function setVerifier(address _verifierAddress) external onlyOwner {
        require(_verifierAddress != address(0), "Invalid verifier address");
        verifierAddress = _verifierAddress;
        emit VerifierSet(_verifierAddress);
    }
    
    /**
     * @dev Verify production and mint NFT directly to marketplace listing
     * @param producer The address of the hydrogen producer
     * @param price The price for the credit in wei
     * @param tokenURI The metadata URI for the NFT
     */
    function verifyAndMintToListing(
        address producer,
        uint256 price,
        string memory tokenURI
    ) external {
        require(msg.sender == verifierAddress, "Only verifier can call this");
        require(producer != address(0), "Invalid producer address");
        require(price > 0, "Price must be greater than 0");
        
        // Increment token ID
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        // Mint NFT to this contract
        _safeMint(address(this), tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Create marketplace listing
        listings[tokenId] = Listing({
            producer: payable(producer),
            price: price,
            isActive: true
        });
        
        // Add to token IDs array
        _allTokenIds.push(tokenId);
        
        emit CreditListed(tokenId, producer, price);
    }
    
    /**
     * @dev Buy a credit NFT from the marketplace
     * @param tokenId The ID of the token to purchase
     */
    function buyCredit(uint256 tokenId) external payable {
        require(_exists(tokenId), "Token does not exist");
        require(listings[tokenId].isActive, "Listing is not active");
        require(msg.value >= listings[tokenId].price, "Insufficient funds");
        
        Listing storage listing = listings[tokenId];
        
        // Transfer payment to producer
        listing.producer.transfer(listing.price);
        
        // Transfer NFT from contract to buyer
        _safeTransfer(address(this), msg.sender, tokenId, "");
        
        // Deactivate listing
        listing.isActive = false;
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit CreditSold(tokenId, msg.sender, listing.producer);
    }
    
    /**
     * @dev Get all active listings
     * @return tokenIds Array of active token IDs
     * @return producers Array of producer addresses
     * @return prices Array of prices
     */
    function getActiveListings() 
        external 
        view 
        returns (
            uint256[] memory tokenIds,
            address[] memory producers,
            uint256[] memory prices
        ) 
    {
        // Count active listings
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _allTokenIds.length; i++) {
            if (listings[_allTokenIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create arrays for active listings
        tokenIds = new uint256[](activeCount);
        producers = new address[](activeCount);
        prices = new uint256[](activeCount);
        
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < _allTokenIds.length; i++) {
            uint256 tokenId = _allTokenIds[i];
            if (listings[tokenId].isActive) {
                tokenIds[currentIndex] = tokenId;
                producers[currentIndex] = listings[tokenId].producer;
                prices[currentIndex] = listings[tokenId].price;
                currentIndex++;
            }
        }
    }
    
    /**
     * @dev Get listing details for a specific token
     * @param tokenId The token ID to query
     * @return producer The producer address
     * @return price The price in wei
     * @return isActive Whether the listing is active
     */
    function getListing(uint256 tokenId) 
        external 
        view 
        returns (address producer, uint256 price, bool isActive) 
    {
        require(_exists(tokenId), "Token does not exist");
        Listing memory listing = listings[tokenId];
        return (listing.producer, listing.price, listing.isActive);
    }
    
    /**
     * @dev Get total number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override to support interface detection
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
