// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20; 

contract VeridusAnchor { 

    struct Credential { 
        address issuer; 
        uint256 timestamp; 
        bool exists; 
    } 

    mapping(bytes32 => Credential) public credentials; 

    event CredentialAnchored( 
        bytes32 hash, 
        address issuer, 
        uint256 timestamp 
    ); 

    function anchorCredential(bytes32 hash) external { 

        require( 
            !credentials[hash].exists, 
            "Already anchored" 
        ); 

        credentials[hash] = Credential({ 
            issuer: msg.sender, 
            timestamp: block.timestamp, 
            exists: true 
        }); 

        emit CredentialAnchored( 
            hash, 
            msg.sender, 
            block.timestamp 
        ); 
    } 

    function verifyCredential(bytes32 hash) 
        external 
        view 
        returns ( 
            address issuer, 
            uint256 timestamp, 
            bool exists 
        ) 
    { 
        Credential memory cred = 
            credentials[hash]; 

        return ( 
            cred.issuer, 
            cred.timestamp, 
            cred.exists 
        ); 
    } 
} 
