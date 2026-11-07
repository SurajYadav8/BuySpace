// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Time-bound airspace LEASE certificates on Hedera.
 *
 * Hedera JSON-RPC quirk:
 * - Wallets send `value` in 18-decimal wei (same as Ethereum).
 * - Inside the EVM, `msg.value` is exposed in 8-decimal tinybars.
 * So we store prices in 18-decimal wei and compare against msg.value * 1e10.
 */
contract AirspaceLeaseMarket {
    string public name = "AirSpace Lease";
    string public symbol = "AIRLEASE";
    uint256 public nextLeaseId = 1;
    uint256 public nextListingId = 1;

    /// @dev 1e10 = 10^(18-8) — scale tinybars → wei for payment checks
    uint256 private constant TINYBAR_TO_WEI = 1e10;

    struct Listing {
        address seller;
        uint256 titleTokenId;
        uint256 priceWei; // 18-decimal HBAR (parseEther)
        uint256 leaseDays;
        string metadataURI;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => string) public tokenURI;
    mapping(uint256 => uint256) public leaseExpiresAt;

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 titleTokenId,
        uint256 priceWei,
        uint256 leaseDays
    );
    event LeasePurchased(
        uint256 indexed listingId,
        uint256 indexed leaseTokenId,
        address indexed buyer,
        uint256 expiresAt
    );
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function createListing(
        uint256 titleTokenId,
        uint256 priceWei,
        uint256 leaseDays,
        string calldata metadataURI
    ) external returns (uint256 listingId) {
        require(leaseDays > 0 && leaseDays <= 3650, "bad term");
        require(priceWei > 0, "bad price");
        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            titleTokenId: titleTokenId,
            priceWei: priceWei,
            leaseDays: leaseDays,
            metadataURI: metadataURI,
            active: true
        });
        emit ListingCreated(listingId, msg.sender, titleTokenId, priceWei, leaseDays);
    }

    function purchase(uint256 listingId) external payable returns (uint256 leaseTokenId) {
        Listing storage listing = listings[listingId];
        require(listing.active, "inactive");

        // Normalize Hedera tinybar msg.value → 18-decimal wei for comparison
        uint256 paidWei = msg.value * TINYBAR_TO_WEI;
        require(paidWei >= listing.priceWei, "underpay");

        listing.active = false;

        leaseTokenId = nextLeaseId++;
        ownerOf[leaseTokenId] = msg.sender;
        balanceOf[msg.sender] += 1;
        tokenURI[leaseTokenId] = listing.metadataURI;
        uint256 expiresAt = block.timestamp + listing.leaseDays * 1 days;
        leaseExpiresAt[leaseTokenId] = expiresAt;

        // msg.value is already correct tinybars for the HBAR amount paid
        (bool ok, ) = payable(listing.seller).call{value: msg.value}("");
        require(ok, "payout failed");

        emit Transfer(address(0), msg.sender, leaseTokenId);
        emit LeasePurchased(listingId, leaseTokenId, msg.sender, expiresAt);
    }
}
