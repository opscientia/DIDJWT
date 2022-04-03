const { ethers } = require('hardhat');

exports.vmExceptionStr = 'VM Exception while processing transaction: reverted with reason string ';

exports.orcidKid = '7hdmdswarosg3gjujo8agwtazgkp1ojs';
exports.orcidBotomBread = '0x222c22737562223a22';
exports.orcidTopBread = '0x222c22617574685f74696d65223a';

exports.googleKid = '729189450d49028570425266f03e737f45af2932'
exports.googleBottomBread = '0x222c22656d61696c223a22'
exports.googleTopBread = '0x222c22656d61696c5f7665726966696564223a'

exports.deployVerifyJWTContract = async (...args) => {
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  return await upgrades.deployProxy(VJWT, args, {
    initializer: 'initialize',
  });
}

exports.deployIdAggregator = async () => {
  const IdentityAggregator = await ethers.getContractFactory("IdentityAggregator");
  const idAggregator = await IdentityAggregator.deploy();
  await idAggregator.deployed();
  return idAggregator;
}

// input: x (string); output: keccak256 of string
exports.sha256FromString = x => ethers.utils.sha256(ethers.utils.toUtf8Bytes(x))
// input: x (string); output: sha256 of string
exports.keccak256FromString = x => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(x))

// Make sure it does bottomBread + id + topBread and does not allow any other text in between. If Google changes their JWT format so that the sandwich now contains other fields between bottomBread and topBread, this should fail until the contract is updated. 
exports.sandwichIDWithBreadFromContract = async (id, contract) => {
  let sandwich = (await contract.bottomBread()) + Buffer.from(id).toString('hex') + (await contract.topBread());
  sandwich = sandwich.replaceAll('0x', '');
  return sandwich
}

// Converts JWKS RSAkey to e and n:
exports.jwksKeyToPubkey = (jwks) => {
  let parsed = JSON.parse(jwks)
  return [
    ethers.BigNumber.from(Buffer.from(parsed['e'], 'base64url')), 
    ethers.BigNumber.from(Buffer.from(parsed['n'], 'base64url'))
  ]
}