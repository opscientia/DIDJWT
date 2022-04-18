// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

// New key to upgrade to
let newKey = `{
    "kty": "RSA",
    "use": "sig",
    "e": "AQAB",
    "alg": "RS256",
    "kid": "d332ab545cc189df133efddb3a6c402ebf489ac2",
    "n": "pnvsf_d6daVCXm6NoBHxpIhkk345edh7GaiXl25XR4_q2ATkiZMBF8foXaa_LTyr8W5dmvqIE71p_T9ygVLMoP7YumjOimrbwB3gEV1ekI-d2rkRbCFg56bzifkAi8gdQW3pj4j-bouOSNkEAUeVSDsHst1f-sFmckZmb1Pe1bWLI-k6TXirXQpGDEZKeh1AWxillo9AWqmDXalurQt46W6rd1y2RCj5Y5zXQheNF6Il0Izc4K5RDBKkanyZ7Dq_ZFuTpVJkxPgCjN6G8cfzM0JKujWX4Zit2xCmZhVfr7hDodnNEPo1IppWNrjcfZOtA_Jh6yBlB7T8DWd1l1PvUQ"
  }
  `
newKey = `{
    "kid": "f1338ca26835863f671408f41738a7b49e740fc0",
    "n": "vCk1vqT3qTLWsZ0yyO6T5sHBFUMPI9bcjT9yO94cZUfJjttRV_RMxUgvB-c3o-dx7f4WrM3knYoWn5pmGH6_B3vJbvnTzfnjojaBfsqn8Cdof1mI3N6ZKmhFVWz-Sui65ycb9F2MVw-z0DcZxk_DcBEMG6Jxps9I2_hFm7xkCPjiN2Q8T-MLNhJYnoxBe1VtuyCFFEDAtU5VXIyJEdDoz_MXIR7o8TsQTnX1ZpB4SijtShz4oJXaQGeSb8eb9AgwiOuiFKHndiMaemtEfnIkU4EXZ_MXXLdi0Rq-euA7XVFk-j1jVxRtVOhrz0VIMy2B8g6l817zKHqC3ZIv1PbUVQ",
    "kty": "RSA",
    "e": "AQAB",
    "use": "sig",
    "alg": "RS256"
  }`
// Converts JWKS RSAkey to e, n, and kid:
const jwksKeyToPubkey = (jwks) => {
  let parsed = JSON.parse(jwks)
  return [
    ethers.BigNumber.from(Buffer.from(parsed['e'], 'base64url')), 
    ethers.BigNumber.from(Buffer.from(parsed['n'], 'base64url')),
    parsed['kid']
  ]
}

async function main() {
    const [e, n, kid] = jwksKeyToPubkey(newKey)
    await rotate('0x50E3d48f04eD1AF12476637F1A99ecdC8347f632', e, n, kid)
    console.log('Key rotation should have been successfully completed!')
}


async function rotate(address, newE, newN, newKid) {
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  let vjwt = VJWT.attach(address)
  await vjwt.handleKeyRotation(newE, newN, newKid)
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
