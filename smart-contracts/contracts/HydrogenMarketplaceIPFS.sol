// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HydrogenCreditSystemIPFS
 * @dev Enhanced system for managing Green Hydrogen Credits with IPFS metadata storage
 */
contract HydrogenCreditSystemIPFS is Ownable {
    
    // Regulatory authority address - only this address can approve credits
    address public regulatoryAuthority;
    
    // Credit structure with IPFS integration
    struct Credit {
        address producer;
        uint256 quantity; // in kg
        uint256 credits; // calculated credits based on quantity
        string ipfsHash; // IPFS hash containing complete metadata
        bool isApproved;
        uint256 approvedAt;
        uint256 createdAt;
    }
    
    // Marketplace listing structure
    struct MarketplaceListing {
        uint256 creditId;
        address seller;
        uint256 pricePerCredit; // in wei
        uint256 creditsAvailable;
        bool isActive;
        uint256 listedAt;
    }
    
    // Mapping from credit ID to credit details
    mapping(uint256 => Credit) public credits;
    
    // Mapping from producer to their credit IDs
    mapping(address => uint256[]) public producerCredits;
    
    // Mapping from listing ID to marketplace listing
    mapping(uint256 => MarketplaceListing) public marketplaceListings;
    
    // Array to track all credit IDs
    uint256[] private _allCreditIds;
    
    // Array to track all active listing IDs
    uint256[] private _activeListingIds;
    
    // Credit ID counter
    uint256 private _creditIdCounter;
    
    // Listing ID counter
    uint256 private _listingIdCounter;
    
    // Events
    event RegulatoryAuthoritySet(address indexed newAuthority);
    event CreditGenerated(uint256 indexed creditId, address indexed producer, uint256 quantity, uint256 credits, string ipfsHash);
    event CreditApproved(uint256 indexed creditId, address indexed authority);
    event CreditListed(uint256 indexed listingId, uint256 indexed creditId, address indexed seller, uint256 pricePerCredit, uint256 creditsAvailable);
    event CreditPurchased(uint256 indexed listingId, address indexed buyer, uint256 creditsPurchased, uint256 totalPrice);
    event ListingCancelled(uint256 indexed listingId);
    
    constructor() {}
    
    /**
     * @dev Set the regulatory authority address (only owner can call)
     * @param _authorityAddress The address of the regulatory authority
     */
    function setRegulatoryAuthority(address _authorityAddress) external onlyOwner {
        require(_authorityAddress != address(0), "Invalid authority address");
        regulatoryAuthority = _authorityAddress;
        emit RegulatoryAuthoritySet(_authorityAddress);
    }
    
    /**
     * @dev Generate credits for approved hydrogen production with IPFS metadata
     * @param producer The address of the hydrogen producer
     * @param quantity The quantity of hydrogen produced in kg
     * @param ipfsHash The IPFS hash containing complete credit metadata
     */
    function generateCredits(
        address producer,
        uint256 quantity,
        string memory ipfsHash
    ) external returns (uint256) {
        require(msg.sender == regulatoryAuthority, "Only regulatory authority can generate credits");
        require(producer != address(0), "Invalid producer address");
        require(quantity > 0, "Quantity must be greater than 0");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        // Increment credit ID
        _creditIdCounter++;
        uint256 creditId = _creditIdCounter;
        
        // Calculate credits based on quantity (1 kg = 0.1 credits)
        uint256 calculatedCredits = quantity / 10;
        
        // Create credit record
        credits[creditId] = Credit({
            producer: producer,
            quantity: quantity,
            credits: calculatedCredits,
            ipfsHash: ipfsHash,
            isApproved: true,
            approvedAt: block.timestamp,
            createdAt: block.timestamp
        });
        
        // Add to producer's credits
        producerCredits[producer].push(creditId);
        
        // Add to all credits array
        _allCreditIds.push(creditId);
        
        emit CreditGenerated(creditId, producer, quantity, calculatedCredits, ipfsHash);
        emit CreditApproved(creditId, msg.sender);
        
        return creditId;
    }
    
    /**
     * @dev List credits for sale in the marketplace
     * @param creditId The credit ID to list
     * @param pricePerCredit Price per credit in wei
     * @param creditsToSell Number of credits to sell
     */
    function listCreditsForSale(
        uint256 creditId,
        uint256 pricePerCredit,
        uint256 creditsToSell
    ) external returns (uint256) {
        require(creditId <= _creditIdCounter && creditId > 0, "Credit does not exist");
        Credit memory credit = credits[creditId];
        require(credit.producer == msg.sender, "Only credit owner can list for sale");
        require(credit.isApproved, "Credit must be approved");
        require(pricePerCredit > 0, "Price must be greater than 0");
        require(creditsToSell > 0 && creditsToSell <= credit.credits, "Invalid credits amount");
        
        // Increment listing ID
        _listingIdCounter++;
        uint256 listingId = _listingIdCounter;
        
        // Create marketplace listing
        marketplaceListings[listingId] = MarketplaceListing({
            creditId: creditId,
            seller: msg.sender,
            pricePerCredit: pricePerCredit,
            creditsAvailable: creditsToSell,
            isActive: true,
            listedAt: block.timestamp
        });
        
        // Add to active listings
        _activeListingIds.push(listingId);
        
        emit CreditListed(listingId, creditId, msg.sender, pricePerCredit, creditsToSell);
        
        return listingId;
    }
    
    /**
     * @dev Purchase credits from marketplace
     * @param listingId The listing ID to purchase from
     * @param creditsToPurchase Number of credits to purchase
     */
    function purchaseCredits(uint256 listingId, uint256 creditsToPurchase) external payable {
        require(listingId <= _listingIdCounter && listingId > 0, "Listing does not exist");
        MarketplaceListing storage listing = marketplaceListings[listingId];
        require(listing.isActive, "Listing is not active");
        require(creditsToPurchase > 0 && creditsToPurchase <= listing.creditsAvailable, "Invalid credits amount");
        
        uint256 totalPrice = listing.pricePerCredit * creditsToPurchase;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Update listing
        listing.creditsAvailable -= creditsToPurchase;
        if (listing.creditsAvailable == 0) {
            listing.isActive = false;
        }
        
        // Transfer payment to seller
        payable(listing.seller).transfer(totalPrice);
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit CreditPurchased(listingId, msg.sender, creditsToPurchase, totalPrice);
    }
    
    /**
     * @dev Cancel a marketplace listing
     * @param listingId The listing ID to cancel
     */
    function cancelListing(uint256 listingId) external {
        require(listingId <= _listingIdCounter && listingId > 0, "Listing does not exist");
        MarketplaceListing storage listing = marketplaceListings[listingId];
        require(listing.seller == msg.sender, "Only seller can cancel listing");
        require(listing.isActive, "Listing is not active");
        
        listing.isActive = false;
        
        emit ListingCancelled(listingId);
    }
    
    /**
     * @dev Get all approved credits with IPFS hashes
     */
    function getApprovedCredits() 
        external 
        view 
        returns (
            uint256[] memory creditIds,
            address[] memory producers,
            uint256[] memory quantities,
            uint256[] memory creditAmounts,
            string[] memory ipfsHashes
        ) 
    {
        uint256 approvedCount = _allCreditIds.length;
        
        creditIds = new uint256[](approvedCount);
        producers = new address[](approvedCount);
        quantities = new uint256[](approvedCount);
        creditAmounts = new uint256[](approvedCount);
        ipfsHashes = new string[](approvedCount);
        
        for (uint256 i = 0; i < approvedCount; i++) {
            uint256 creditId = _allCreditIds[i];
            Credit memory credit = credits[creditId];
            
            creditIds[i] = creditId;
            producers[i] = credit.producer;
            quantities[i] = credit.quantity;
            creditAmounts[i] = credit.credits;
            ipfsHashes[i] = credit.ipfsHash;
        }
    }
    
    /**
     * @dev Get active marketplace listings
     */
    function getActiveListings()
        external
        view
        returns (
            uint256[] memory listingIds,
            uint256[] memory creditIds,
            address[] memory sellers,
            uint256[] memory pricesPerCredit,
            uint256[] memory creditsAvailable,
            string[] memory ipfsHashes
        )
    {
        // Count active listings
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            if (marketplaceListings[_activeListingIds[i]].isActive) {
                activeCount++;
            }
        }
        
        listingIds = new uint256[](activeCount);
        creditIds = new uint256[](activeCount);
        sellers = new address[](activeCount);
        pricesPerCredit = new uint256[](activeCount);
        creditsAvailable = new uint256[](activeCount);
        ipfsHashes = new string[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            uint256 listingId = _activeListingIds[i];
            MarketplaceListing memory listing = marketplaceListings[listingId];
            
            if (listing.isActive) {
                Credit memory credit = credits[listing.creditId];
                
                listingIds[index] = listingId;
                creditIds[index] = listing.creditId;
                sellers[index] = listing.seller;
                pricesPerCredit[index] = listing.pricePerCredit;
                creditsAvailable[index] = listing.creditsAvailable;
                ipfsHashes[index] = credit.ipfsHash;
                index++;
            }
        }
    }
    
    /**
     * @dev Get credit details including IPFS hash
     */
    function getCredit(uint256 creditId) 
        external 
        view 
        returns (
            address producer, 
            uint256 quantity, 
            uint256 creditAmount, 
            string memory ipfsHash,
            bool isApproved,
            uint256 createdAt
        ) 
    {
        require(creditId <= _creditIdCounter && creditId > 0, "Credit does not exist");
        Credit memory credit = credits[creditId];
        return (
            credit.producer, 
            credit.quantity, 
            credit.credits, 
            credit.ipfsHash,
            credit.isApproved,
            credit.createdAt
        );
    }
    
    /**
     * @dev Get total number of generated credits
     */
    function totalCredits() external view returns (uint256) {
        return _creditIdCounter;
    }
    
    /**
     * @dev Get total number of listings
     */
    function totalListings() external view returns (uint256) {
        return _listingIdCounter;
    }
}
