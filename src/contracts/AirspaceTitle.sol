// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Airspace TITLE NFT — the tokenized airspace parcel (not land).
 * Owner mints to their connected wallet via MetaMask on Hedera.
 */
contract AirspaceTitle {
    string public name = "AirSpace Title";
    string public symbol = "AIRTITLE";
    uint256 public nextId = 1;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => string) public tokenURI;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event AirspaceMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string propertyAddress,
        uint256 currentHeight,
        uint256 maximumHeight
    );

    function mint(
        string calldata propertyAddress,
        uint256 currentHeight,
        uint256 maximumHeight,
        string calldata uri
    ) external returns (uint256 tokenId) {
        require(maximumHeight > currentHeight, "invalid envelope");
        tokenId = nextId++;
        ownerOf[tokenId] = msg.sender;
        balanceOf[msg.sender] += 1;
        tokenURI[tokenId] = uri;
        emit Transfer(address(0), msg.sender, tokenId);
        emit AirspaceMinted(tokenId, msg.sender, propertyAddress, currentHeight, maximumHeight);
    }
}
