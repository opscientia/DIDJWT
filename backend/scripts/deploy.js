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
  "IdentityAggregator" : "0xE15Cb9bd333beCfB835184574ADE3Ad8BD4be49b",
  "WTFBios" : "0x0897bBfA5d0A6c604b672c253D96c04b9194C991",
  "VerifyJWT" : {
    "orcid" : "0xd476A40ecc1231DC8cD54B25Ad2a27299Ac23443",
    "google" : "0x60E93fa7c44151B0b5568625DBB5Cf2F33223D56",
    "twitter" : "0x0c68aD479884ed4034a0FEf1C276B982E6d1D48B",
    "github" : "0xb09aba6c32F095934AcadAcd6Ac02BB8F9249c31"
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
  // console.log(orcid.address)
  // const google = await deployVerifyJWTContract(...googleParams.getDeploymentParams())
  // console.log(google.address)
  // const github = await deployVerifyJWTContract(...githubParams.getDeploymentParams())
  // console.log(github.address)
  // const twitter = await deployVerifyJWTContract(...twitterParams.getDeploymentParams())
  // console.log(twitter.address)

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

  // let idAgg = (await ethers.getContractFactory('IdentityAggregator')).attach(testAddresses.IdentityAggregator)
  // let contracts = {}
  // for(const c of Object.keys(testAddresses.VerifyJWT)){
  //   contracts[c] = (await ethers.getContractFactory('VerifyJWT')).attach(testAddresses.VerifyJWT[c])
  //   await idAgg.addVerifyJWTContract(c, contracts[c].address)
  // }
  // await idAgg.setBiosContractAddress(testAddresses.WTFBios)

  console.log(await (await (await ethers.getContractFactory('VerifyJWT')).attach('0xd476A40ecc1231DC8cD54B25Ad2a27299Ac23443')).credsForAddress('0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388'))
  console.log(await (await (await ethers.getContractFactory('VerifyJWT')).attach('0xd476A40ecc1231DC8cD54B25Ad2a27299Ac23443')).addressForCreds(Buffer.from('0000-0002-2308-9517')))

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
