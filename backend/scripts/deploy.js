// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

// These constants should be shared dependancy with tests so the same code isn't duplicated across them without a shared module
const {
  orcidParams,
  googleParams,
  twitterParams,
  githubParams,
  getParamsForVerifying,
  deployVerifyJWTContract,
  // upgradeVerifyJWTContract,
  // sha256FromString,
  // keccak256FromString,
  // sandwichDataWithBreadFromContract,
  // jwksKeyToPubkey,
  // vmExceptionStr,
} = require('../utils.js');

const testAddresses = {
  "IdentityAggregator" : "0x7f78Cdd0bAB95979F2d0699fF549bb2A79830f93",
  "WTFBios" : "0xe1e0533f082308C8e4AA817E617dAA984A8986d5",
  "VerifyJWT" : {
    "orcid" : "0xAd7C2C3B9487e87A0699385C9a617eAb488e95BF",
    "google" : "0xc21eB7f6321ADcF0945f93362072901A18288f8A",
    "twitter" : "0x97093De07A0Bab1a92a5d885a5E0A561F719C919",
    "github" : "0x25F1886A0a40EF216A04e165c096ee1286A24B8F"
  }
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // const idAgg = (await ethers.getContractFactory('IdentityAggregator')).attach('0x4278b0B8aC44dc61579d5Ec3F01D8EA44873b079')
  // const idAgg = await deployIdAggregator();

  // const bios = await deployWTFBios();
  // const orcid = await deployORCID();
  // const google = await deployGoogle();
  // const github = await deployGithub();
  // const twitter = await deployTwitter();
  // const discord  = await deployDiscord();
  // const orcid = await deployVerifyJWTContract(...orcidParams.getDeploymentParams())
  // const google = await deployVerifyJWTContract(...googleParams.getDeploymentParams())
  // const github = await deployVerifyJWTContract(...githubParams.getDeploymentParams())
  // const twitter = await deployVerifyJWTContract(...twitterParams.getDeploymentParams())

  // idAgg.setBiosContractAddress(bios.address)

  // const twitter = (await ethers.getContractFactory('VerifyJWT')).attach('0x97A2FAf052058b86a52A07F730EF8a16aD9aFcFB')
  // const github = (await ethers.getContractFactory('VerifyJWT')).attach('0x6029BD948942c7b355149087c47462c66Ea147ba')
  // const discord = (await ethers.getContractFactory('VerifyJWT')).attach('0xca6d00d3f78AD5a9B386824227BBe442c84344EA')
  // const google = (await ethers.getContractFactory('VerifyJWT')).attach('0xC334b3465790bC77299D42635B25D77E3e46A78b')
  // const orcid = (await ethers.getContractFactory('VerifyJWT')).attach('0x4D39C84712C9A13f4d348050E82A2Eeb45DB5e29')
  // await idAgg.addVerifyJWTContract('orcid', orcid.address)
  // await idAgg.addVerifyJWTContract('google', google.address)
  // await idAgg.addVerifyJWTContract('twitter', twitter.address)
  // await idAgg.addVerifyJWTContract('github', github.address)
  // await idAgg.addVerifyJWTContract('discord', discord.address)
  // await deployFacebook();
  // await deployWTFUtils();
  // await deployWTFBios()

  let idAgg = (await ethers.getContractFactory('IdentityAggregator')).attach(testAddresses.IdentityAggregator)
  // let contracts = {}
  // for(const c of Object.keys(testAddresses.VerifyJWT)){
  //   contracts[c] = (await ethers.getContractFactory('VerifyJWT')).attach(testAddresses.VerifyJWT[c])
  //   await idAgg.addVerifyJWTContract(c, contracts[c].address)
  // }
  // await idAgg.setBiosContractAddress(testAddresses.WTFBios)
}

async function deployWTFUtils() {
  const WTFUtils = await ethers.getContractFactory('WTFUtils')
  const wu = await WTFUtils.deploy();
  await wu.deployed();
  console.log('WTFUtils: ', wu.address);
  return wu
}

async function deployWTFBios() {
  const WTFBios = await ethers.getContractFactory('WTFBios')
  const wtfBios = await WTFBios.deploy();
  await wtfBios.deployed();
  console.log('WTFBios: ', wtfBios.address);
  return wtfBios
}

async function deployIdAggregator() {
  const IdentityAggregator = await ethers.getContractFactory('IdentityAggregator')
  const idAggregator = await IdentityAggregator.deploy();
  await idAggregator.deployed();
  console.log('IdentityAggregator: ', idAggregator.address);
  return idAggregator
}

// async function deployGoogle() {
//   let VJWT = await ethers.getContractFactory('VerifyJWT')
//   let google = await upgrades.deployProxy(VJWT, [eGoogle, nGoogle, kidGoogle, googleBottomBread, googleTopBread], {
//     initializer: 'initialize',
//   });
//   console.log('GOOGLE: ' + google.address);
//   return VJWT
// }

// async function deployORCID(){
//   let VJWT = await ethers.getContractFactory('VerifyJWT')
//   let orcid = await upgrades.deployProxy(VJWT, [eOrcid, nOrcid, kidOrcid, orcidBottomBread, orcidTopBread], {
//     initializer: 'initialize',
//   });
//   console.log('ORCID: ' + orcid.address);
//   return VJWT
// }

// async function deployTwitter(){
//   let VJWT = await ethers.getContractFactory('VerifyJWT')
//   let twitter = await upgrades.deployProxy(VJWT, [eTwitter, nTwitter, kidTwitter, twitterBottomBread, twitterTopBread], {
//     initializer: 'initialize',
//   });
//   console.log('TWITTER: ' + twitter.address);
//   return VJWT
// }

// async function deployGithub(){
//   let VJWT = await ethers.getContractFactory('VerifyJWT')
//   let github = await upgrades.deployProxy(VJWT, [eGithub, nGithub, kidGithub, githubBottomBread, githubTopBread], {
//     initializer: 'initialize',
//   });
//   console.log('GITHUB: ' + github.address);
//   return VJWT
// }

async function deployDiscord(){
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  let discord = await upgrades.deployProxy(VJWT, [eDiscord, nDiscord, kidDiscord, discordBottomBread, discordTopBread], {
    initializer: 'initialize',
  });
  console.log('DISCORD: ' + discord.address);
  return VJWT
}
// async function deployGoogle(){
//   let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(eGoogle, nGoogle, googleKid, googleBottomBread, googleTopBread);
//   await vjwt.deployed();
//   console.log('GOOGLE: ' + vjwt.address);
// }
// async function deployFacebook(){
//   let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread);
//   await vjwt.deployed();
//   console.log('ORCID: ' + vjwt.address);
// }

// async function deployORCID(){
//     let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread);
//     await vjwt.deployed();
//     console.log('ORCID: ' + vjwt.address);
// }

// async function deployFacebook(){
  // const pubkey = JSON.parse('{"keys":[{"kid":"55f0c4f24f66f836956f781c4498e1d2f62fb9ce","kty":"RSA","alg":"RS256","use":"sig","n":"5ZpR3YBWZdJrW1pvwsao0zYxFRlnOg2xbOoygsoILQ95GsvAVgysxGImWFUncdvdmP8Zg0YPdnNb0ink_SbkUcDynAiQM588sP1Fys2iLFbo62-UVNFlhiXd_YqxWvff-AdezCXhQ-FIe41WEg9d6p_TUo9Pbzm_hAkolrkM7P03RyVOKRCm7_xulo9eTAu7RaiCC6feiLMOgBjtoSmGIwU-q62miql3jGYjZzJpR4xwvz3WFNLci0IAuoNhMua7EzK6fTsN9Zl5LqRCTIqQFUENgYk14M4FMOeoS959KMqDTQf3JQ6lNDDYAOBNH5GH0I8UOE6rqBZQ56EUuWOsIQ","e":"AQAB"},{"kid":"e59ff3c4dcb52b72dc2e18391371ab7907509c54","kty":"RSA","alg":"RS256","use":"sig","n":"sJgg0V8YxUNIv25JH6o_rbL6L95xhuSmBxguLi_iXBObdN54ewsNuqUjaHBZMvlK0P727eFAIQ_6FJ8j0qKlbyysHgnEbvvbfq2dltrhASf2l_K7bRmAoKHGOmKL4YAEssd4GBND2iCUKRN-hfNNvRtX5zY7ujqd1xtgpjOT6p442K0JtO-L1Q-W7VjrIFF9okAFa9bjGm9TgwIxWIXhtn6IZeDX367UnsPFq09U29wuMG-lBIE9sbkm5IuVRl26BXjGKSu1xj8AqT75loj3MIwfB_9i20Ov2qxLLG_bOseAlzUtGwhWryEh6LI_xAowJHk-Di9BBkzBqMZ0vOyiFw","e":"AQAB"}]}')
  //   for (const i of [0,1]){
  //     const [e, n] = [
  //     ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['e'], 'base64url')), 
  //     Buffer.from(pubkey.keys[0]['n'], 'base64url')
  //   ]
  //   let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(e,n);
  //   await vjwt.deployed();
  //   console.log('FB' + i + ': ' + vjwt.address);
  // }
    
// }
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
