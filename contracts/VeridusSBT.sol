// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.24; 

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; 
import "@openzeppelin/contracts/access/Ownable.sol"; 

contract VeridusSBT is ERC721, Ownable { 

    uint256 public nextTokenId; 
    string private baseTokenURI;

    mapping(uint256 => bool) public locked; 

    event SoulboundMinted( 
        address indexed student, 
        uint256 tokenId, 
        string degreeId 
    ); 

    constructor(string memory _initialBaseURI) 
        ERC721("Veridus Credential", "VERIDUS") 
        Ownable(msg.sender) 
    {
        baseTokenURI = _initialBaseURI;
    } 

    function mint( 
        address student, 
        string memory degreeId 
    ) 
        external 
        onlyOwner 
        returns (uint256) 
    { 
        uint256 tokenId = nextTokenId++; 

        _safeMint(student, tokenId); 

        locked[tokenId] = true; 

        emit SoulboundMinted( 
            student, 
            tokenId, 
            degreeId 
        ); 

        return tokenId; 
    } 

    /* ========= SOULBOUND LOGIC ========= */ 

    function _update( 
        address to, 
        uint256 tokenId, 
        address auth 
    ) 
        internal 
        override 
        returns (address) 
    { 
        address from = 
            super._update(to, tokenId, auth); 

        if (from != address(0) && to != address(0)) { 
            revert("Soulbound: Non-transferable"); 
        } 

        return from; 
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseTokenURI = _newBaseURI;
    }
} 
