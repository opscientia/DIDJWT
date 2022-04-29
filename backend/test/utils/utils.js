const { ethers, upgrades } = require('hardhat');
const wtf = require('wtf-lib');

const search64 = require('../../../../whoisthis.wtf-frontend/src/searchForPlaintextInBase64.js');

exports.vmExceptionStr = 'VM Exception while processing transaction: reverted with reason string ';

exports.orcidBottomBread = '0x222c22737562223a22'
exports.orcidTopBread = '0x222c22617574685f74696d65223a'

exports.googleBottomBread = '0x222c22656d61696c223a22'
exports.googleTopBread = '0x222c22656d61696c5f7665726966696564223a'

exports.twitterBottomBread = '0x7b226372656473223a22'
exports.twitterTopBread = '0x222c22617564223a22676e6f736973222c22'

exports.githubBottomBread = '0x7b226372656473223a22'
exports.githubTopBread = '0x222c22617564223a22676e6f736973222c22'



let contractAddresses = wtf.getContractAddresses()

exports.upgradeVerifyJWTContract = async (service) => {
    let address = contractAddresses.VerifyJWT.gnosis[service]
    let VJWT = await ethers.getContractFactory('VerifyJWT')
    let NewVJWT = await ethers.getContractFactory('VerifyJWTv2')
    // Import the implementation if it's not already loaded:
    await upgrades.forceImport(address, VJWT, {kind : 'uups'})
    let vjwt = await upgrades.upgradeProxy(address, NewVJWT)
    return vjwt
}

exports.deployVerifyJWTContract = async (...args) => {
  const VerifyJWT = await ethers.getContractFactory('VerifyJWT')
  const vjwt = await upgrades.deployProxy(VerifyJWT, args, {
    kind: 'uups',
    initializer: 'initialize',
  });
  await vjwt.deployed();
  return vjwt;
}

exports.deployIdAggregator = async () => {
  const IdentityAggregator = await ethers.getContractFactory("IdentityAggregator");
  const idAggregator = await IdentityAggregator.deploy();
  await idAggregator.deployed();
  return idAggregator;
}

exports.deployWTFBios = async () => {
  const WTFBios = await ethers.getContractFactory("WTFBios");
  const wtfBios = await WTFBios.deploy();
  await wtfBios.deployed();
  return wtfBios;
}

// input: x (string); output: keccak256 of string
exports.sha256FromString = x => ethers.utils.sha256(ethers.utils.toUtf8Bytes(x))
// input: x (string); output: sha256 of string
exports.keccak256FromString = x => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(x))

// Sandwiches data between contract.bottomBread() and contract.topBread(). By default does ID with id bread. If type='exp' is specified, it will sandwich with the expiration bread
exports.sandwichDataWithBreadFromContract = async (data, contract, type='id') => {
  let bottomBread; 
  let topBread;
  if(type == 'id') {
    bottomBread = await contract.bottomBread()
    topBread = await contract.topBread()
  } else if(type == 'exp') {
    bottomBread = await contract.expBottomBread()
    topBread = await contract.expTopBread()
  } else {
    throw new Error(`type "${type}" not recognized`)
  }

  let sandwich = bottomBread + Buffer.from(data).toString('hex') + topBread;
  sandwich = sandwich.replaceAll('0x', '');
  return sandwich
}

// Converts JWKS RSAkey to e, n, and kid:
exports.jwksKeyToPubkey = (jwks) => {
  let parsed = JSON.parse(jwks)
  return [
    ethers.BigNumber.from(Buffer.from(parsed['e'], 'base64url')), 
    ethers.BigNumber.from(Buffer.from(parsed['n'], 'base64url')),
    parsed['kid']
  ]
}
