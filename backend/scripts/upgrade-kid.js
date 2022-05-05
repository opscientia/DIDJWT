// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");
const wtf = require("wtf-lib");

const contractAddresses = wtf.getContractAddresses();
// New key to upgrade to
let newKey = `{
  "n": "qR7fa5Gb2rhy-RJCJwSFn7J2KiKs_WgMXVR-23Z6OfX89_utHGkM-Qk27abDGPXa0u9OKzwOU2JZx7yNye7LH4kKX1PEAEz0p9XGbfF3yFyiD5JkziOfQyYj9ERKWfxKatpk-oi9D_p2leQKzTfEZWIfLVZkgNXFkUdhzCG68j5kFhZ1Ys9bRRDo3Q1BkLXmP_Y6PW1g74_rvAYCiQ6hJVvyyXYnqHcoawedgO6_MQihaSeAW25AhY8MXVo4-MdNvboahOlJg280YuxkCZiRqxyQEqd5HKCPzP49TDQbdAxDa900ewCQK9gkbHiNKFbOBv_b94YfMh93NUoEa-jCnw",
  "use": "sig",
  "e": "AQAB",
  "kty": "RSA",
  "alg": "RS256",
  "kid": "861649e450315383f6b9d510b7cd4e9226c3cd88"
}
  `
// newKey = `{
//     "kid": "f1338ca26835863f671408f41738a7b49e740fc0",
//     "n": "vCk1vqT3qTLWsZ0yyO6T5sHBFUMPI9bcjT9yO94cZUfJjttRV_RMxUgvB-c3o-dx7f4WrM3knYoWn5pmGH6_B3vJbvnTzfnjojaBfsqn8Cdof1mI3N6ZKmhFVWz-Sui65ycb9F2MVw-z0DcZxk_DcBEMG6Jxps9I2_hFm7xkCPjiN2Q8T-MLNhJYnoxBe1VtuyCFFEDAtU5VXIyJEdDoz_MXIR7o8TsQTnX1ZpB4SijtShz4oJXaQGeSb8eb9AgwiOuiFKHndiMaemtEfnIkU4EXZ_MXXLdi0Rq-euA7XVFk-j1jVxRtVOhrz0VIMy2B8g6l817zKHqC3ZIv1PbUVQ",
//     "kty": "RSA",
//     "e": "AQAB",
//     "use": "sig",
//     "alg": "RS256"
//   }`
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
    await rotate(contractAddresses.VerifyJWT.gnosis.google, e, n, kid)
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
