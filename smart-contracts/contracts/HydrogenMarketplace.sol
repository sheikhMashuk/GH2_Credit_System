// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HydrogenCreditSystem
 * @dev A system for managing Green Hydrogen Credits with marketplace functionality
 */
contract HydrogenCreditSystem is Ownable {
    
    // Regulatory authority address - only this address can approve credits
    address public regulatoryAuthority;
    
    // Credit structure
    struct Credit {
        address producer;
        uint256 quantity; // in kg
        uint256 credits; // calculated credits based on quantity
        string location;
        string productionDate;
        bool isApproved;
        uint256 approvedAt;
        address currentOwner; // Current owner of the credit
        uint256 pricePerCredit; // Price per credit in wei
        bool isForSale; // Whether the credit is available for purchase
    }
    
    // Marketplace listing structure
    struct Listing {
        uint256 creditId;
        address seller;
        uint256 creditsAvailable;
        uint256 pricePerCredit; // in wei
        bool isActive;
    }
    
    // Mapping from credit ID to credit details
    mapping(uint256 => Credit) public credits;
    
    // Mapping from listing ID to listing details
    mapping(uint256 => Listing) public listings;
    
    // Mapping from producer to their credit IDs
    mapping(address => uint256[]) public producerCredits;
    
    // Array to track all credit IDs
    uint256[] private _allCreditIds;
    
    // Array to track active listing IDs
    uint256[] private _activeListings;
    
    // Credit ID counter
    uint256 private _creditIdCounter;
    
    // Listing ID counter
    uint256 private _listingIdCounter;
    
    // Credit calculation rate (100 kg = 1 credit, with 2 decimal precision)
    uint256 public constant DECIMAL_PLACES = 100; // For 2 decimal places
    
    // Events
    event RegulatoryAuthoritySet(address indexed newAuthority);
    event CreditGenerated(uint256 indexed creditId, address indexed producer, uint256 quantity, uint256 credits);
    event CreditApproved(uint256 indexed creditId, address indexed authority);
    event CreditListed(uint256 indexed listingId, uint256 indexed creditId, address indexed seller, uint256 creditsAvailable, uint256 pricePerCredit);
    event CreditPurchased(uint256 indexed listingId, address indexed buyer, uint256 creditsPurchased, uint256 totalPrice);
    event CreditTransferred(uint256 indexed creditId, address indexed from, address indexed to, uint256 amount);
    
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
     * @dev Generate credits for approved hydrogen production
     * @param producer The address of the hydrogen producer
     * @param quantity The quantity of hydrogen produced in kg
     * @param location The production location
     * @param productionDate The production date
     */
    function generateCredits(
        address producer,
        uint256 quantity,
        string memory location,
        string memory productionDate
    ) external returns (uint256) {
        require(msg.sender == regulatoryAuthority, "Only regulatory authority can generate credits");
        require(producer != address(0), "Invalid producer address");
        require(quantity > 0, "Quantity must be greater than 0");
        
        // Increment credit ID
        _creditIdCounter++;
        uint256 creditId = _creditIdCounter;
        
        // Calculate credits based on quantity (kg) - 100 kg = 1 credit with 2 decimal places
        uint256 calculatedCredits = quantity; // Store quantity directly, divide by 100 in frontend
        
        // Create credit record
        credits[creditId] = Credit({
            producer: producer,
            quantity: quantity,
            credits: calculatedCredits,
            location: location,
            productionDate: productionDate,
            isApproved: true,
            approvedAt: block.timestamp,
            currentOwner: producer,
            pricePerCredit: 0,
            isForSale: false
        });
        
        // Add to producer's credits
        producerCredits[producer].push(creditId);
        
        // Add to all credits array
        _allCreditIds.push(creditId);
        
        emit CreditGenerated(creditId, producer, quantity, calculatedCredits);
        emit CreditApproved(creditId, msg.sender);
        
        return creditId;
    }
    
    /**
     * @dev Get all approved credits
     * @return creditIds Array of credit IDs
     * @return producers Array of producer addresses
     * @return quantities Array of quantities in kg
     * @return creditAmounts Array of calculated credits
     */
    function getApprovedCredits() 
        external 
        view 
        returns (
            uint256[] memory creditIds,
            address[] memory producers,
            uint256[] memory quantities,
            uint256[] memory creditAmounts
        ) 
    {
        uint256 approvedCount = _allCreditIds.length;
        
        creditIds = new uint256[](approvedCount);
        producers = new address[](approvedCount);
        quantities = new uint256[](approvedCount);
        creditAmounts = new uint256[](approvedCount);
        
        for (uint256 i = 0; i < approvedCount; i++) {
            uint256 creditId = _allCreditIds[i];
            Credit memory credit = credits[creditId];
            
            creditIds[i] = creditId;
            producers[i] = credit.producer;
            quantities[i] = credit.quantity;
            creditAmounts[i] = credit.credits;
        }
    }
    
    /**
     * @dev Get credits for a specific producer
     * @param producer The producer address
     * @return creditIds Array of credit IDs for the producer
     */
    function getProducerCredits(address producer) 
        external 
        view 
        returns (uint256[] memory creditIds) 
    {
        return producerCredits[producer];
    }
    
    /**
     * @dev Get credit details
     * @param creditId The credit ID to query
     * @return producer The producer address
     * @return quantity The quantity in kg
     * @return creditAmount The calculated credits
     * @return location The production location
     * @return productionDate The production date
     * @return isApproved Whether the credit is approved
     */
    function getCredit(uint256 creditId) 
        external 
        view 
        returns (
            address producer, 
            uint256 quantity, 
            uint256 creditAmount, 
            string memory location,
            string memory productionDate,
            bool isApproved
        ) 
    {
        require(creditId <= _creditIdCounter && creditId > 0, "Credit does not exist");
        Credit memory credit = credits[creditId];
        return (
            credit.producer, 
            credit.quantity, 
            credit.credits, 
            credit.location,
            credit.productionDate,
            credit.isApproved
        );
    }
    
    /**
     * @dev Get total number of generated credits
     */
    function totalCredits() external view returns (uint256) {
        return _creditIdCounter;
    }
    
    // Fixed price per credit: 0.001 ETH = 1000000000000000 wei
    uint256 public constant FIXED_PRICE_PER_CREDIT = 1000000000000000;
    
    /**
     * @dev List credits for sale in the marketplace with fixed pricing
     * @param creditId The credit ID to list
     * @param creditsToSell Amount of credits to sell
     */
    function listCreditsForSale(
        uint256 creditId,
        uint256 creditsToSell
    ) external returns (uint256) {
        Credit storage credit = credits[creditId];
        require(credit.currentOwner == msg.sender && creditsToSell > 0 && creditsToSell <= credit.credits, "Invalid listing");
        
        // Create listing with minimal storage writes
        unchecked {
            ++_listingIdCounter;
        }
        uint256 listingId = _listingIdCounter;
        
        listings[listingId] = Listing({
            creditId: creditId,
            seller: msg.sender,
            creditsAvailable: creditsToSell,
            pricePerCredit: FIXED_PRICE_PER_CREDIT,
            isActive: true
        });
        
        _activeListings.push(listingId);
        
        emit CreditListed(listingId, creditId, msg.sender, creditsToSell, FIXED_PRICE_PER_CREDIT);
        
        return listingId;
    }
    
    /**
     * @dev Purchase credits from marketplace with ETH payment
     * @param listingId The listing ID to purchase from
     * @param creditsToPurchase Amount of credits to purchase
     */
    function purchaseCredits(uint256 listingId, uint256 creditsToPurchase) external payable {
        Listing storage listing = listings[listingId];
        require(listing.isActive && creditsToPurchase > 0 && creditsToPurchase <= listing.creditsAvailable, "Invalid purchase");
        
        uint256 totalPrice = creditsToPurchase * FIXED_PRICE_PER_CREDIT;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Update listing first to save gas
        unchecked {
            listing.creditsAvailable -= creditsToPurchase;
        }
        if (listing.creditsAvailable == 0) {
            listing.isActive = false;
        }
        
        // Transfer credit ownership for full purchases only
        if (creditsToPurchase == credits[listing.creditId].credits) {
            credits[listing.creditId].currentOwner = msg.sender;
        }
        
        // Single payment transfer with gas optimization
        (bool success, ) = payable(listing.seller).call{value: totalPrice}("");
        require(success, "Payment failed");
        
        // Return excess payment if any
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit CreditPurchased(listingId, msg.sender, creditsToPurchase, totalPrice);
    }
    
    /**
     * @dev Get all active marketplace listings
     */
    function getActiveListings() external view returns (
        uint256[] memory listingIds,
        uint256[] memory creditIds,
        address[] memory sellers,
        uint256[] memory creditsAvailable,
        uint256[] memory pricesPerCredit
    ) {
        uint256 activeCount = 0;
        
        // Count active listings
        for (uint256 i = 0; i < _activeListings.length; i++) {
            if (listings[_activeListings[i]].isActive) {
                activeCount++;
            }
        }
        
        // Initialize arrays
        listingIds = new uint256[](activeCount);
        creditIds = new uint256[](activeCount);
        sellers = new address[](activeCount);
        creditsAvailable = new uint256[](activeCount);
        pricesPerCredit = new uint256[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < _activeListings.length; i++) {
            uint256 listingId = _activeListings[i];
            Listing memory listing = listings[listingId];
            
            if (listing.isActive) {
                listingIds[index] = listingId;
                creditIds[index] = listing.creditId;
                sellers[index] = listing.seller;
                creditsAvailable[index] = listing.creditsAvailable;
                pricesPerCredit[index] = listing.pricePerCredit;
                index++;
            }
        }
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) external view returns (
        uint256 creditId,
        address seller,
        uint256 creditsAvailable,
        uint256 pricePerCredit,
        bool isActive
    ) {
        require(listingId <= _listingIdCounter && listingId > 0, "Listing does not exist");
        Listing memory listing = listings[listingId];
        return (
            listing.creditId,
            listing.seller,
            listing.creditsAvailable,
            listing.pricePerCredit,
            listing.isActive
        );
    }
}
