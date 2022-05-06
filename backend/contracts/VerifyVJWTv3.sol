// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { WTFUtils } from "contracts/WTFUtils.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract VerifyJWTv3 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
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
    event KeyAuthorization(bool result_);


    bytes emptyBytes;
    bytes32 emptyBytesHash;


    /* -------------------------------------------------------------------------
     * New variables after contract upgrade: to check the timestamps of the JWT 
     * and make sure expired JWTs can't be used 
     * ------------------------------------------------------------------------- */
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

    /* -------------------------------------------------------------------------
     * New variables for v3 contract upgrade: to improve JWT commitment 
     * ------------------------------------------------------------------------- */
     struct JWTCommit {
       bytes32 boundCommit; //boundCommit is keccak256(bytes(JWT) || address), where || is concatenation. It binds the commitment to an address
       uint256 blockNumber; //block number when commitment made
     }

    mapping(bytes32 => JWTCommit) public commitments; //Should be public so frontend can check that commitment has been successfully made before revealing -- Revealing without a commit enables frontrunners to impersonate

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

      emptyBytesHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470; //keccak256(emptyBytes)
      // initialze parent classes (part of upgradeable proxy design pattern) 
      __Ownable_init();
      // console.log(owner()); MAKE SURE THE OWNER IS SET UPON INITIALIZATION!!! OTHERWISE MAYBE ANYONE CAN SET OWNER
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
    
    function verifyJWT(bytes memory signature, string memory headerAndPayload) public returns (bool) {
      return WTFUtils._verifyJWT(e, n, signature, WTFUtils.stringToBytes(headerAndPayload));
    }


    function commitJWTProof(bytes32 unboundCommit, bytes32 boundCommit) public {
      require(commitments[unboundCommit].blockNumber == 0, 'JWT has already been commited');

      commitments[unboundCommit] = JWTCommit(boundCommit,block.number);
      // pendingVerification.push(jwtXORPubkey);
    }
  // perhaps make private, but need it to be public to test
  function checkCommit(address a, string memory jwt) public view returns (bool) {
    bytes memory jwtBytes = WTFUtils.stringToBytes(jwt);
    return checkCommit(a, keccak256(jwtBytes), jwtBytes);
  }

  // Same as checkCommit but for private (hashed) JWTs.
  function checkCommit(address a, bytes32 unboundCommit, bytes memory plaintext) public view returns (bool) {
    // Convert pubkey to bytes32
    bytes memory pkBytes = WTFUtils.addressToBytes(a);
    // Find what the bound commit *should* be
    bytes32 idealBoundCommit = keccak256(
      bytes.concat(plaintext, pkBytes)
    );
    // Lookup unbound commit
    JWTCommit memory c = commitments[unboundCommit];
    require(c.blockNumber < block.number, "You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun");
    require(c.blockNumber > 0 , "Proof not found; it needs to have been submitted to commitJWTProof in a previous block");
    require(c.boundCommit == idealBoundCommit, "Your address was not bound with the original commit");
    return true;
  }

  function _verify(address addr, bytes memory signature, string memory headerAndPayload) private returns (bool) { 
    // bytes32 jwtHash = sha256(WTFUtils.stringToBytes(jwt));
    // check whether JWT is valid 
    require(verifyJWT(signature, headerAndPayload),"Verification of JWT failed");
    // check whether sender has already proved knowledge of the jwt
    require(checkCommit(addr, headerAndPayload), "Proof of previous knowlege of JWT unsuccessful");
    return true;
  }

  // This is the endpoint a frontend should call. It takes a signature, JWT, sandwich (see comments), which has start/end index of where the sandwich can be found. It also takes a payload index start, as it must know the where the payload is to decode the Base64 JWT
  function verifyMe(bytes memory signature, string memory jwt, uint payloadIdxStart, ProposedSandwichAt calldata proposedIDSandwich, ProposedSandwichAt calldata proposedExpSandwich) public { //also add  to verify that proposedId exists at jwt[idxStart:idxEnd]. If so, also verify that it starts with &id= and ends with &. So that we know it's a whole field and was actually the ID given
    bytes memory jwtBytes = WTFUtils.stringToBytes(jwt);

    require(_verify(msg.sender, signature, jwt), "JWT Verification failed");

    // there seems to be no advantage in lying about where the payload starts, but it may be more secure to implemenent a check here that the payload starts after a period
    
    bytes memory payload = WTFUtils.sliceBytesMemory(jwtBytes, payloadIdxStart, jwtBytes.length);
    bytes memory padByte = bytes('=');

    while(payload.length % 4 != 0){
      payload = bytes.concat(payload, padByte);
    }
    bytes memory b64decoded = WTFUtils.decodeFromBytes(payload);
  
    require(bytesIncludeSandwichAt(b64decoded, proposedIDSandwich, bottomBread, topBread), 
            "Failed to find correct ID sandwich in JWT");

    bytes memory creds = WTFUtils.sliceBytesMemory(proposedIDSandwich.sandwichValue, bottomBread.length, proposedIDSandwich.sandwichValue.length - topBread.length);
    
    require(bytesIncludeSandwichAt(b64decoded, proposedExpSandwich, expBottomBread, expTopBread), 
            "Failed to find correct expiration sandwich in JWT");     

    bytes memory expBytes = WTFUtils.sliceBytesMemory(proposedExpSandwich.sandwichValue, expBottomBread.length, proposedExpSandwich.sandwichValue.length - expTopBread.length);
    
    uint256 exp = WTFUtils.parseInt(expBytes);
    require(exp > block.timestamp, "JWT is expired");
    
    // Can ignore:
    // The contract will forget old JWTs to save space. There's a security concern with this: if user submits a a new JWT before the first one expires, hacker can submit the old one. This is mitigated by enforcing the submission of new JWTs only when the old one is invalid
    // require(timestampsForCreds[creds].JWTExpclaim < block.timestamp, "Old JWT needs to be expired before new submission"); 
    // ^^ commented out because JWTHashUsed prevents this concern

    // make sure there is no previous entry for this JWT - it should only be usable once!
    bytes32 jwtHash = keccak256(WTFUtils.stringToBytes(jwt));

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
    require(WTFUtils.bytesAreEqual(
                          WTFUtils.sliceBytesMemory(proposedSandwich_.sandwichValue, 0, bottomBread_.length),
                          bottomBread_
            ),
            "Failed to find correct bottom bread in sandwich"
    );

    require(WTFUtils.bytesAreEqual(
                          WTFUtils.sliceBytesMemory(proposedSandwich_.sandwichValue, proposedSandwich_.sandwichValue.length-topBread_.length, proposedSandwich_.sandwichValue.length),
                          topBread_
            ),
            "Failed to find correct top bread in sandwich"
    );

    require(WTFUtils.bytesAreEqual(
                          WTFUtils.sliceBytesMemory(string_, proposedSandwich_.idxStart, proposedSandwich_.idxEnd),
                          proposedSandwich_.sandwichValue
            ),
           "Proposed sandwich not found"
    );
    return true;
  }

  
  function getRegisteredCreds() external view returns (bytes[] memory) {
      return registeredCreds;
    }

    function getRegisteredAddresses() external view returns (address[] memory) {
      return registeredAddresses;
    }
  /* --Private Credentials--


  // User can just submit hash of the header and payload, so they do not reveal any sensitive data! But they still prove their ownership of the JWT
  // Note that this does not check that the headerAndPayloadHash is from a valid JWT -- it just checks that it matches the signature. I believe the validity
  // Of the hash can be checked by a zkSNARK, but this does not do so
  function linkPrivateJWT(bytes memory signature, bytes32 headerAndPayloadHash) public { 
    require(checkCommit(msg.sender, headerAndPayloadHash));
    bytes32 hashed = WTFUtils.hashFromSignature(e, n, signature);
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
  */
}
