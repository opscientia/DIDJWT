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
  discordParams,
  getParamsForVerifying,
  deployVerifyJWTContract,
  deployVerifyJWTContractWithCustomFactory,
  upgradeVerifyJWTContract,
  // sha256FromString,
  // keccak256FromString,
  // sandwichDataWithBreadFromContract,
  // jwksKeyToPubkey,
  // vmExceptionStr,
} = require('../utils.js');


async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const wu = await (await ethers.getContractFactory('WTFUtils')).deploy()
  console.log('WTFUtils', wu.address)

  const idAgg = await deployIdAggregator();
  console.log('idagg', idAgg.address)

  const bios = await deployWTFBios();
  console.log('bios', bios.address)

  const VerifyJWT = await ethers.getContractFactory('VerifyJWTv2', {
    libraries : {
      WTFUtils : wu.address //https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#library-linking for more info on this argument
    }
  })


  for(const s of [
    {name:'twitter', args:await orcidParams.getDeploymentParams()},
    {name:'discord', args:await orcidParams.getDeploymentParams()},
    {name:'github', args:await orcidParams.getDeploymentParams()},
    {name:'orcid', args:await orcidParams.getDeploymentParams()}
  ]){
    const vjwt = await deployVerifyJWTContractWithCustomFactory({factory:VerifyJWT, args: s.args})
    await vjwt.deployed();
    let tx = await idAgg.addVerifyJWTContract(s.name, vjwt.address)
    await tx.wait()
    console.log(s.name, vjwt.address);
  }
  console.log('Done: ', await idAgg.getKeywords())
  // const idAgg = (await ethers.getContractFactory('IdentityAggregator')).attach('0x4278b0B8aC44dc61579d5Ec3F01D8EA44873b079')
  // console.log(await idAgg.getAllAccounts('0xb1d534a8836fB0d276A211653AeEA41C6E11361E'))


  // await upgradeService('orcid', orcidParams)
  // await upgradeService('google', googleParams)
  // await upgradeService('twitter', twitterParams, true)
  // await upgradeService('github', githubParams, true)
  // await upgradeService('discord', discordParams, true)

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

// Upgrades to V2 and changes appropriate parameters (top bread, bottom bread, and aud)
async function upgradeService(name, newParams, forceImport=false) {
  // Upgrade VJWT, with WTFUtils address 0x1DEae05441acd0C48A3Dc0272E24Cd9D5AcE32Af
  let contract = await upgradeVerifyJWTContract(name, '0x1DEae05441acd0C48A3Dc0272E24Cd9D5AcE32Af', forceImport)
  console.log('upgraded ', contract.address)
  let tx = await contract.changeSandwich(newParams.idBottomBread, newParams.idTopBread, newParams.expBottomBread, newParams.expTopBread)
  await tx.wait()
  tx = await contract.changeAud(newParams.aud)
  console.log('changed aud', tx)
  await tx.wait()
  console.log('new aud', await contract.aud())
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
