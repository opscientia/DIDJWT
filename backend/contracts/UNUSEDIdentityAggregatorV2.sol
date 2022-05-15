// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;


// /**
//  * This contract is identical to IdentityAggregator.sol, except getAllAccounts in this contract
//  * returns two additional values: the user's ENS name (if it exists) and whether the user is
//  * registered on Proof of Humanity.
//  */

// import "hardhat/console.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
// import '@ensdomains/ens-contracts/contracts/resolvers/Resolver.sol';
// import '@ensdomains/ens-contracts/contracts/registry/ReverseRegistrar.sol';

// import "./VerifyJWT.sol";
// import "./WTFBios.sol";


// abstract interface PoHProxy {
//     function isRegistered(address _submissionID) external view returns (bool);
// }

// contract IdentityAggregator is Ownable  {

//     mapping(string => address) public contractAddrForKeyword; // e.g., "orcid" => VerifyJWT(orcidContractAddress)

//     mapping(string => string) private keywordForKeyword; // Allows easier lookup for keywords

//     string[] private keywords; // e.g., "orcid"

//     address private biosContract;

//     ENS ens = ENS(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e);
//     PoHProxy pohProxy = PoHProxy(0x1dAD862095d40d43c2109370121cf087632874dB);


//     event AddSupportForContract(string contractKeyword);
//     event RemoveSupportForContract(string contractKeyword);


//     /// @notice Add support for a new VerifyJWT contract.
//     /// @param keyword The string used to denote the source of the JWT (e.g., "twitter").
//     /// @param contractAddress The address of the JWT contract to be supported.
//     function addVerifyJWTContract(string calldata keyword, address contractAddress) public onlyOwner {
//         // Require that neither this keyword nor this contract has been added
//         require(bytes(keywordForKeyword[keyword]).length == 0, "This keyword is already being used");

//         keywords.push(keyword);
//         keywordForKeyword[keyword] = keyword;
//         contractAddrForKeyword[keyword] = contractAddress;

//         emit AddSupportForContract(keyword);
//     }

//     /// @notice Remove support for a VerifyJWT contract.
//     /// @param keyword The string used to lookup the contract.
//     function removeSupportFor(string calldata keyword) public onlyOwner {
//         require(contractAddrForKeyword[keyword] != address(0), "There is no corresponding contract for this keyword");
        
//         for (uint i = 0; i < keywords.length; i++) {
//             if (keccak256(bytes(keywords[i])) == keccak256(bytes(keyword))) {
//                 contractAddrForKeyword[keyword] = address(0);
//                 keywordForKeyword[keyword] = "";
//                 keywords[i] = "";

//                 emit RemoveSupportForContract(keyword);
//                 break;
//             }
//         }
//     }

//     /// @notice For user, get creds for every platform designated in keywords.
//     /// @param user The address whose creds will be returned.
//     /// @return creds A list of creds corresponding to user.
//     function getAllAccounts(address user) public view returns (bytes[] memory creds, string memory name, string memory bio) {
//         // JWT creds
//         bytes[] memory allCreds = new bytes[](keywords.length);
//         for (uint i = 0; i < keywords.length; i++) {
//             if (bytes(keywords[i]).length != 0) {
//                 address contractAddr = contractAddrForKeyword[keywords[i]];
//                 VerifyJWT contract_ = VerifyJWT(contractAddr);
//                 bytes memory credsTemp = contract_.credsForAddress(user);
//                 if (credsTemp.length != 0) {
//                     allCreds[i] = credsTemp;
//                 }
//             }
//         }
//         // ENS
//         // 1. Perform namehash (i.e., get <address>.addr.reverse)
//         bytes32 addrNode = node(user);
//         // 2. Get resolver for <addrNode>
//         address resolverAddr = ens.resolver(addrNode);
//         Resolver resolver = Resolver(resolverAddr);
//         // 3. Call name() on that resolver
//         string memory ensName = resolver.name(addrNode);
//         // 4. Perform forward resolution to verify
//         bytes32 nameNode = computeNamehash(ensName);
//         resolverAddr = ens.resolver(nameNode);
//         bytes32 addr = resolver.addr(nameNode);
//         if (addr != addrNode) {
//             ensName = "";
//         }
//         // Proof of Humanity
//         bool pohRegistered = pohProxy.isRegistered(user);
        
//         // Holonym name/bio
//         string memory name_ = "";
//         string memory bio_ = "";
//         if (biosContract != address(0)) {
//             WTFBios wtfBios = WTFBios(biosContract);
//             name_ = wtfBios.nameForAddress(user);
//             bio_ = wtfBios.bioForAddress(user);
//         }

//         return (allCreds, name_, bio_, ensName, pohRegistered);
//     }

//     function getKeywords() public view returns (string[] memory) {
//         return keywords;
//     }

//     function setBiosContractAddress(address biosContract_) public onlyOwner {
//         biosContract = biosContract_;
//     }
    
//     function getBiosContractAddress() public view returns (address) {
//         return biosContract;
//     }

//     //
//     // https://github.com/ensdomains/ens/blob/master/contracts/ReverseRegistrar.sol
//     //
//     bytes32 public constant ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;
//     /**
//      * @dev Returns the node hash for a given account's reverse records.
//      * @param addr The address to hash
//      * @return The ENS node hash.
//      */
//     function node(address addr) public pure returns (bytes32) {
//         return keccak256(abi.encodePacked(ADDR_REVERSE_NODE, sha3HexAddress(addr)));
//     }
//     /**
//      * @dev An optimised function to compute the sha3 of the lower-case
//      *      hexadecimal representation of an Ethereum address.
//      * @param addr The address to hash
//      * @return ret The SHA3 hash of the lower-case hexadecimal encoding of the
//      *         input address.
//      */
//     function sha3HexAddress(address addr) private pure returns (bytes32 ret) {
//         addr;
//         ret; // Stop warning us about unused variables
//         assembly {
//             // let lookup := 0x3031323334353637383961626364656600000000000000000000000000000000

//             for { let i := 40 } gt(i, 0) { } {
//                 i := sub(i, 1)
//                 mstore8(i, byte(and(addr, 0xf), lookup))
//                 addr := div(addr, 0x10)
//                 i := sub(i, 1)
//                 mstore8(i, byte(and(addr, 0xf), lookup))
//                 addr := div(addr, 0x10)
//             }

//             ret := keccak256(0, 40)
//         }
//     }

//     // Implementation of EIP-137 from conS: 
//     // https://ethereum.stackexchange.com/questions/54550/ens-how-to-compute-namehash-from-name-in-a-smart-contract
//     function computeNamehash(string memory _name) public pure returns (bytes32 namehash) {
//         namehash = 0x0000000000000000000000000000000000000000000000000000000000000000;
//         namehash = keccak256(
//             abi.encodePacked(namehash, keccak256(abi.encodePacked('eth')))
//         );
//         namehash = keccak256(
//             abi.encodePacked(namehash, keccak256(abi.encodePacked(_name)))
//         );
//         return namehash;
//     }

// }
