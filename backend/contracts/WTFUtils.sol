pragma solidity ^0.8.0;
import 'hardhat/console.sol';
import "contracts/Base64.sol"; 

library WTFUtils { 
    
    event JWTVerification(bool result_);

    // https://ethereum.stackexchange.com/questions/8346/convert-address-to-string
    function bytesToAddress(bytes memory b_) private pure returns (address addr) {
    assembly {
        addr := mload(add(b_,20))
    } 
    }

    function bytes32ToAddress(bytes32 b_) private pure returns (address addr) {
    assembly {
        addr := mload(add(b_,20)) //shouldn't it be 0x20 or is that equivalent
    } 
    }

    function bytes32ToUInt256(bytes32 b_) public pure returns (uint256 u_) {
    assembly {
        u_ := mload(add(b_,20)) //shouldn't it be 0x20 or is that equivalent
    } 
    }

    function bytesToFirst32BytesAsBytes32Type(bytes memory input_) public pure returns (bytes32 b_) {
    assembly {
        // there is probably an easier way to do this
        let unshifted := mload(add(input_,32))
        b_ := shr(96, unshifted)
    } 
    }

    // We need to take the last 32 bytes to obtain the sha256 hash from the the PKCS1-v1_5 padding
    function bytesToLast32BytesAsBytes32Type(bytes memory input_) public pure returns (bytes32 b_) {
    assembly {
        // there is probably an easier way to do this
        let len := mload(input_)
        let end := add(input_, len)
        b_ := mload(end)
    }
    }
    
    function addressToBytes(address a) public pure returns (bytes memory) {
    return abi.encodePacked(a);
    }
    
    function bytes32ToBytes(bytes32 b_) public pure returns (bytes memory){
    return abi.encodePacked(b_);
    }
    // function addressToBytes32(address a) public pure returns (bytes32) {
    //   return abi.encodePacked(a);
    // }

    function stringToBytes(string memory s) public pure returns (bytes memory) {
    return abi.encodePacked(s);
    }

    function bytesAreEqual(bytes memory  a_, bytes memory b_) public pure returns (bool) {
    return (a_.length == b_.length) && (keccak256(a_) == keccak256(b_));
    }

    // // Can't figure out why this isn't working right now, so using less efficient version instead:
    // function sliceBytesMemory(bytes memory input_, uint256 start_, uint256 end_) public view returns (bytes memory r) {
    //   require(start_ < end_, "index start must be less than inded end");
    //   uint256 sliceLength = end_ - start_;
    //   bytes memory r = new bytes(sliceLength);
    //   console.log('HERE');
    //   console.logBytes(r);
    //   assembly {
    //     let offset := add(start_, 0x20)
    //     if iszero(staticcall(not(0), add(input_, offset), sliceLength, add(r, 0x20), sliceLength)) {
    //         revert(0, 0)
    //     }
    //   }
    //  
    //
    // }

    // This could be more efficient by not copying the whole thing -- just the parts that matter
    function sliceBytesMemory(bytes memory input_, uint256 start_, uint256 end_) public view returns (bytes memory r) {
    uint256 len_ = input_.length;
    bytes memory r = new bytes(len_);
    
    assembly {
        // Use identity to copy data
        if iszero(staticcall(not(0), 0x04, add(input_, 0x20), len_, add(r, 0x20), len_)) {
            revert(0, 0)
        }
    }
    return destructivelySliceBytesMemory(r, start_, end_);
    }
    
    function destructivelySliceBytesMemory(bytes memory m, uint256 start, uint256 end) public view returns (bytes memory r) {
    require(start < end, "index start must be less than inded end");
    assembly {
        let offset := add(start, 0x20) //first 0x20 bytes of bytes type is length (no. of bytes)
        r := add(m, start)
        mstore(r, sub(end, start))
    }
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
    }
    
    // returns whether JWT is signed by public key e_, n_, and emits an event with verification result
    function _verifyJWT(uint256 e_, bytes memory n_, bytes memory signature_, bytes memory message_) public returns (bool) {
        bytes32 hashed = hashFromSignature(e_, n_, signature_);
        bool verified = hashed == sha256(message_);
        emit JWTVerification(verified);
        return verified;
    }

    // Get the hash of the JWT from the signature
    function hashFromSignature(uint256 e_, bytes memory n_, bytes memory signature_) public returns (bytes32) {
        bytes memory encrypted = modExp(signature_, e_, n_);
        bytes32 unpadded = bytesToLast32BytesAsBytes32Type(encrypted);
        return unpadded;
    }


    // Base64 Library modified from https://github.com/Brechtpd/base64/blob/main/base64.sol
 
    function decodeFromBytes(bytes memory input) public returns (bytes memory output) {
        return Base64.decodeFromBytes(input);
    }
    

}