//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "contracts/Base64.sol"; 
import "contracts/WTFByteUtils.sol"; 
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract VerifyJWTv2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // Creds herein are the identifier / index field in the JWT, e.g. ORCID ID is the cred for ORCID JWT and email is the cred for gmail JWT 
    
    // Hashes are used to make sure nobody can re-use someone's old JWT without storing the whole JWT to check for uniqueness. The old JWT is still public (it was in the mempool) but it's not wasting gas by being on-chain.
    // mapping(address => bytes32) public JWTHashForAddress;
    mapping(bytes32 => bool) private JWTHashUsed;

    mapping(address => bytes) public credsForAddress;
    mapping(bytes => address) public addressForCreds;

    mapping (address => bytes32) public privateJWTForAddress; //also store hashes of JWT header.payloads for on-chain verified sovereign identity
    mapping(address => mapping(address => bool)) public privateJWTAllowances; //who has access to a user's private credentials

    address[] public registeredAddresses;
    bytes[] public registeredCreds;
    
    mapping(bytes32 => uint256) public proofToBlock; // JWT proof => latest blocknumber when proof was submitted

    // web2 server's RS256 public key, split into exponent and modulus
    uint256 public e;
    bytes public n;
    // kid of JWT (available at JWKS endpoint). It is common for a JWKS endpoint to have multiple keys, so they kid is used to match with the correct key. 
    // the kid field also allays problems due to key rotation, if the frontend checks that the kid matches that of the JWT before submitting, it saves the user gas
    // by never lettign them accidentally submit to a contract with an outdated publickey
    string public kid;

     // It would be very difficult to index people based on their base64url-encoded JWTs. Having a plaintext ID, such as an email address is needed. How can we do this? 
    // Allow the user to select a string within t heir JWT to be indexed by
    // how the id fields start and ed. For example, one web2 service may have IDs in the token as '"userID" : "vitalik.eth", "iat" : ...' 
    // if the user is allowed to choose their id as anywhere in the contract, that would be bad. Here, we can enforce that the id must be wrapped by

    // topBread and bottomBread refer to the start and end of the byte sandwhich which desired credential must be between.
    // for example, a JWT can have many fields, but we just want the email, which is in a part that looks like: '"email" : email_here, "next field' : . So then, you can set topBread to ', "next field' : ' and bottomBread to '"email" : '
    // then, when you validate the JWT, the user supplies '"email" : email_here, "next field', and this contract can approve it because the sandwhich starts and ends the right way
    bytes public topBread;
    bytes public bottomBread;
   


    // bytes32[] public pendingVerification; //unneeded later, just for testing purposes
    bytes32[] public verifiedUsers;

    event modExpEventForTesting(bytes result_);
    event JWTVerification(bool result_);
    event KeyAuthorization(bool result_);

    bytes emptyBytes;
    bytes32 emptyBytesHash;

    /* New variables after contract upgrade: to check the timestamps of the JWT and make sure expired JWTs can't be used */
    struct Timestamps {
      uint256 submittedAt; // When the JWT was submitted to the blockchain
      uint256 JWTExpClaim; // Value of the JWT exp claim
    }

    // Represents a sandwich that *supposedly* starts at idxStart in a string and ends at idxEnd in a string. These values should *not* be assumed to be correct unless later validated.
    struct ProposedSandwichAt {
      uint idxStart;
      uint idxEnd;
      bytes sandwichValue;
    }

    mapping(bytes => Timestamps) public timestampsForCreds; //JWT expiration and time of on-chain submission
    
    bytes public expTopBread;
    bytes public expBottomBread;

    // Initializer rather than constructor so it can be used for proxy pattern
    // exponent and modulus comrpise the RSA public key of the web2 authenticator which signed the JWT. 
    function initialize(uint256 exponent_, bytes memory modulus_, string memory kid_, bytes memory bottomBread_, bytes memory topBread_, bytes memory expBottomBread_, bytes memory expTopBread_) initializer public {
      e = exponent_;
      n = modulus_;
      kid = kid_;
      topBread = topBread_; 
      bottomBread = bottomBread_;
      expTopBread = expTopBread_; 
      expBottomBread = expBottomBread_;

      // initialze parent classes (part of upgradeable proxy design pattern) 
      __Ownable_init();
    }

    // For UUPS upgradeable proxy
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function handleKeyRotation(uint256 newE, bytes calldata newN, string calldata newKid) public onlyOwner {
        e = newE;
        n = newN;
        kid = newKid;
    }

    function changeSandwich(bytes memory newBottomBread, bytes memory newTopBread, bytes memory newExpBottomBread, bytes memory newExpTopBread) public onlyOwner {
        bottomBread = newBottomBread;
        topBread = newTopBread;
        expBottomBread = newExpBottomBread;
        expTopBread = newExpTopBread;
    }

    // BIG thanks to dankrad for this function: https://github.com/dankrad/rsa-bounty/blob/master/contract/rsa_bounty.sol
    // Expmod for bignum operands (encoded as bytes, only base and modulus)
    function modExp(bytes memory base, uint exponent, bytes memory modulus) public returns (bytes memory o) {
        assembly {
            // Get free memory pointer
            let p := mload(0x40)

            // Get base length in bytes
            let bl := mload(base)
            // Get modulus length in bytes
            let ml := mload(modulus)

            // Store parameters for the Expmod (0x05) precompile
            mstore(p, bl)               // Length of Base
            mstore(add(p, 0x20), 0x20)  // Length of Exponent
            mstore(add(p, 0x40), ml)    // Length of Modulus
            // Use Identity (0x04) precompile to memcpy the base
            if iszero(staticcall(10000, 0x04, add(base, 0x20), bl, add(p, 0x60), bl)) {
                revert(0, 0)
            }
            mstore(add(p, add(0x60, bl)), exponent) // Exponent
            // Use Identity (0x04) precompile to memcpy the modulus
            if iszero(staticcall(10000, 0x04, add(modulus, 0x20), ml, add(add(p, 0x80), bl), ml)) {
                revert(0, 0)
            }
            
            // Call 0x05 (EXPMOD) precompile
            if iszero(staticcall(not(0), 0x05, p, add(add(0x80, bl), ml), add(p, 0x20), ml)) {
                revert(0, 0)
            }

            // Update free memory pointer
            mstore(0x40, add(add(p, ml), 0x20))

            // Store correct bytelength at p. This means that with the output
            // of the Expmod precompile (which is stored as p + 0x20)
            // there is now a bytes array at location p
            mstore(p, ml)

            // Return p
            o := p
        }
        
        emit modExpEventForTesting(o);
    }
    
    // returns whether JWT is signed by public key e_, n_, and emits an event with verification result
    function _verifyJWT(uint256 e_, bytes memory n_, bytes memory signature_, bytes memory message_) private returns (bool) {
      bytes32 hashed = hashFromSignature(e_, n_, signature_);
      bool verified = hashed == sha256(message_);
      emit JWTVerification(verified);
      return verified;
    }

    // Get the hash of the JWT from the signature
    function hashFromSignature(uint256 e_, bytes memory n_, bytes memory signature_) public returns (bytes32) {
      bytes memory encrypted = modExp(signature_, e_, n_);
      bytes32 unpadded = WTFByteUtils.bytesToLast32BytesAsBytes32Type(encrypted);
      return unpadded;
    }
    
    function verifyJWT(bytes memory signature, string memory headerAndPayload) public returns (bool) {
      return _verifyJWT(e, n, signature, WTFByteUtils.stringToBytes(headerAndPayload));
    }


    function commitJWTProof(bytes32 proof) public {
      proofToBlock[proof] = block.number;
      // pendingVerification.push(jwtXORPubkey);
    }
  // perhaps make private, but need it to be public to test
  function checkJWTProof(address a, string memory jwt) public view returns (bool) {
    // bytes32 bytes32Pubkey = WTFByteUtils.bytesToFirst32BytesAsBytes32Type(WTFByteUtils.addressToBytes(a));
    // bytes memory keyXORJWTHash = WTFByteUtils.bytes32ToBytes(bytes32Pubkey ^ sha256(WTFByteUtils.stringToBytes(jwt)));
    // bytes32 k = sha256(keyXORJWTHash);
    // require(proofToBlock[k] < block.number, "You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun");
    // require(proofToBlock[k] > 0 , "Proof not found; it needs to have been submitted to commitJWTProof in a previous block");
    // // require(jp.hashedJWT == keccak256(WTFByteUtils.stringToBytes(jwt)), "JWT does not match JWT in proof");
    // return true;
    return checkJWTProof(a, sha256(WTFByteUtils.stringToBytes(jwt)));
  }

  // Same as checkJWTProof but for private (hashed) JWTs.
  function checkJWTProof(address a, bytes32 jwtHash) public view returns (bool) {
    bytes32 bytes32Pubkey = WTFByteUtils.bytesToFirst32BytesAsBytes32Type(WTFByteUtils.addressToBytes(a));
    bytes memory keyXORJWTHash = WTFByteUtils.bytes32ToBytes(bytes32Pubkey ^ jwtHash);
    bytes32 k = sha256(keyXORJWTHash);
    // debugging console.logs
    require(proofToBlock[k] < block.number, "You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun");
    require(proofToBlock[k] > 0 , "Proof not found; it needs to have been submitted to commitJWTProof in a previous block");
    // require(jp.hashedJWT == keccak256(WTFByteUtils.stringToBytes(jwt)), "JWT does not match JWT in proof");
    return true;
  }

  function _verify(address addr, bytes memory signature, string memory jwt) private returns (bool) { 
    bytes32 jwtHash = sha256(WTFByteUtils.stringToBytes(jwt));
    // check whether JWT is valid 
    require(verifyJWT(signature, jwt),"Verification of JWT failed");
    // check whether sender has already proved knowledge of the jwt
    require(checkJWTProof(addr, jwtHash), "Proof of previous knowlege of JWT unsuccessful");
    emit KeyAuthorization(true);
    return true;
  }

  // This is the endpoint a frontend should call. It takes a signature, JWT, sandwich (see comments), which has start/end index of where the sandwich can be found. It also takes a payload index start, as it must know the where the payload is to decode the Base64 JWT
  function verifyMe(bytes memory signature, string memory jwt, uint payloadIdxStart, ProposedSandwichAt calldata proposedIDSandwich, ProposedSandwichAt calldata proposedExpSandwich) public { //also add  to verify that proposedId exists at jwt[idxStart:idxEnd]. If so, also verify that it starts with &id= and ends with &. So that we know it's a whole field and was actually the ID given
    bytes memory jwtBytes = WTFByteUtils.stringToBytes(jwt);

    require(_verify(msg.sender, signature, jwt), "JWT Verification failed");

    // there seems to be no advantage in lying about where the payload starts, but it may be more secure to implemenent a check here that the payload starts after a period
    
    bytes memory payload = WTFByteUtils.sliceBytesMemory(jwtBytes, payloadIdxStart, jwtBytes.length);
    bytes memory padByte = bytes('=');
    // console.log('PAYLOAD CONC');
    // console.log(payload.length);
    // console.log(bytes.concat(payload, padByte).length);
    while(payload.length % 4 != 0){
      payload = bytes.concat(payload, padByte);
    }
    bytes memory b64decoded = Base64.decodeFromBytes(payload);
  
    require(bytesIncludeSandwichAt(b64decoded, proposedIDSandwich, bottomBread, topBread), 
            "Failed to find correct ID sandwich in JWT");

    bytes memory creds = WTFByteUtils.sliceBytesMemory(proposedIDSandwich.sandwichValue, bottomBread.length, proposedIDSandwich.sandwichValue.length - topBread.length);
    
    require(bytesIncludeSandwichAt(b64decoded, proposedExpSandwich, expBottomBread, expTopBread), 
            "Failed to find correct expiration sandwich in JWT");     

    bytes memory expBytes = WTFByteUtils.sliceBytesMemory(proposedExpSandwich.sandwichValue, expBottomBread.length, proposedExpSandwich.sandwichValue.length - expTopBread.length);
    
    uint256 exp = parseInt(expBytes);
    require(exp > block.timestamp, "JWT is expired");
    
    // Can ignore:
    // The contract will forget old JWTs to save space. There's a security concern with this: if user submits a a new JWT before the first one expires, hacker can submit the old one. This is mitigated by enforcing the submission of new JWTs only when the old one is invalid
    // require(timestampsForCreds[creds].JWTExpclaim < block.timestamp, "Old JWT needs to be expired before new submission"); 
    // ^^ commented out because JWTHashUsed prevents this concern

    // make sure there is no previous entry for this JWT - it should only be usable once!
    bytes32 jwtHash = keccak256(WTFByteUtils.stringToBytes(jwt));

    require(JWTHashUsed[jwtHash] == false, "JWT can only be used on-chain once");
    JWTHashUsed[jwtHash] = true;
    

    // update list of registered address and credentials (to keep track of who's registered), iff the address is not already registered
    if(keccak256(credsForAddress[msg.sender]) == emptyBytesHash){
      registeredAddresses.push(msg.sender);
    }
    if(addressForCreds[creds] == address(0)){
      registeredCreds.push(creds);
    }
    

    // update hashmaps of addresses, credentials, and JWTs themselves
    addressForCreds[creds] = msg.sender;
    credsForAddress[msg.sender] = creds;
    timestampsForCreds[creds] = Timestamps(block.timestamp, exp);
    // JWTForAddress[msg.sender] = jwt;

  }


  function bytesIncludeSandwichAt(bytes memory string_, ProposedSandwichAt calldata proposedSandwich_, bytes memory bottomBread_, bytes memory topBread_) public view returns (bool validString) {
    require(WTFByteUtils.bytesAreEqual(
                          WTFByteUtils.sliceBytesMemory(proposedSandwich_.sandwichValue, 0, bottomBread_.length),
                          bottomBread_
            ),
            "Failed to find correct bottom bread in sandwich"
    );

    require(WTFByteUtils.bytesAreEqual(
                          WTFByteUtils.sliceBytesMemory(proposedSandwich_.sandwichValue, proposedSandwich_.sandwichValue.length-topBread_.length, proposedSandwich_.sandwichValue.length),
                          topBread_
            ),
            "Failed to find correct top bread in sandwich"
    );

    // make sure proposed id is found in the original jwt
    require(WTFByteUtils.bytesAreEqual(
                          WTFByteUtils.sliceBytesMemory(string_, proposedSandwich_.idxStart, proposedSandwich_.idxEnd),
                          proposedSandwich_.sandwichValue
            ),
           "proposed sandwich not found in JWT"
    );
    return true;
  }

  // User can just submit hash of the header and payload, so they do not reveal any sensitive data! But they still prove their ownership of the JWT
  // Note that this does not check that the headerAndPayloadHash is from a valid JWT -- it just checks that it matches the signature. To my knowledge,
  // there is no way to check thath a hash is of a valid JWT. That would violate the purpose of a cryptographic hash function.
  function linkPrivateJWT(bytes memory signature, bytes32 headerAndPayloadHash) public { 
    require(checkJWTProof(msg.sender, headerAndPayloadHash));
    bytes32 hashed = hashFromSignature(e, n, signature);
    require(hashed == headerAndPayloadHash, 'headerAndPayloadHash does not match the hash you proved knowledge of');
    // update hashmaps of addresses, credentials, and JWTs themselves
    privateJWTForAddress[msg.sender] = hashed;

  }

  // // For accessing gating private credentials on the Lit Protocol
  // function setAccess(address viewer, bool value) public {
  //   privateJWTAllowances[msg.sender][viewer] = value;
  // }
  // // For accessing private credentials on the Lit Protocol
  // function hasAccess(address owner, address viewer) public view returns (bool result) {
  //   return privateJWTAllowances[owner][viewer];
  // }


  function getRegisteredCreds() external view returns (bytes[] memory) {
    return registeredCreds;
  }

  function getRegisteredAddresses() external view returns (address[] memory) {
    return registeredAddresses;
  }

  // // This function is used for testing purposes and can be deleted later. It's better not to call it from the frontend for security reasons, as the data being XORed is often private. Calling it from the frontend leaks this data to your node provider
  // function XOR(uint256 x, uint256 y) public pure returns (uint256) {
  //   return x ^ y;
  // }
  
  // // Testing function, remove later; this seems to give a different result than ethers.js sha256, perhaps because of byte conversion?
  // function testSHA256OnJWT(string memory jwt) public pure returns (bytes32){
  //   return sha256(WTFByteUtils.stringToBytes(jwt));
  // }

    // from willitscale: https://github.com/willitscale/solidity-util/blob/master/lib/Integers.sol
    // /**
    // * Parse Int
    // * 
    // * Converts an ASCII string value into an uint as long as the string 
    // * its self is a valid unsigned integer
    // * 
    // * @param _value The ASCII string to be converted to an unsigned integer
    // * @return _ret The unsigned value of the ASCII string
    // */
    // function parseInt(string memory _value) public view returns (uint256 _ret) {
    //     bytes memory _bytesValue = bytes(_value);
    //     uint256 j = 1;
    //     uint256 i = _bytesValue.length-1;
    //     while(i >= 0) {
    //         assert(uint8(_bytesValue[i]) >= 48 && uint8(_bytesValue[i]) <= 57);
    //         _ret += (uint8(_bytesValue[i]) - 48)*j;
    //         j*=10;
    //         if(i > 0){i--;}else{break;}
    //     }
    // }

    
    // modified from willitscale: https://github.com/willitscale/solidity-util/blob/master/lib/Integers.sol
    /**
    * Parse Int
    * Bytes instead of string parseInt override
    * @param _bytesValue The bytes to be converted to an unsigned integer. *this is a bytes representation of a string*
    * @return _ret The unsigned value of the ASCII string
    */
    function parseInt(bytes memory _bytesValue) public view returns (uint256 _ret) {
        uint256 j = 1;
        uint256 i = _bytesValue.length-1;
        while(i >= 0) {
            assert(uint8(_bytesValue[i]) >= 48 && uint8(_bytesValue[i]) <= 57);
            _ret += (uint8(_bytesValue[i]) - 48)*j;
            j*=10;
            if(i > 0){i--;}else{break;}
        }
    }

    function abc() public view returns (bytes32) {
      bytes memory emptyBytes_;
      return keccak256(emptyBytes_);
    }

  // Also can be deleted, just to test assumptions about comparing times as strings because Solidity can't easily convert timestamp strings to integers
  // function testTimeAssumptions() public {
  //   string memory timestamp = '1647667098';
  //   string memory anotherTimestamp = '1657667098';
  //   require(block.timestamp > parseInt(timestamp));
  //   require(block.timestamp < parseInt(anotherTimestamp));
  // }

}
