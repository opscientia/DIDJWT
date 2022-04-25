// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

// These constants should be shared dependancy with tests so the same code isn't duplicated across them without a shared module
const orcidBottomBread = '0x222c22737562223a22'
const orcidTopBread = '0x222c22617574685f74696d65223a'

const googleBottomBread = '0x222c22656d61696c223a22'
const googleTopBread = '0x222c22656d61696c5f7665726966696564223a'

const twitterBottomBread = '0x7b226372656473223a22'
const twitterTopBread = '0x222c22617564223a22676e6f736973222c22'

const githubBottomBread = '0x7b226372656473223a22'
const githubTopBread = '0x222c22617564223a22676e6f736973222c22'

const discordBottomBread = '0x7b226372656473223a22'
const discordTopBread = '0x222c22617564223a22676e6f736973222c22'

// Converts JWKS RSAkey to e, n, and kid:
const jwksKeyToPubkey = (jwks) => {
  let parsed = JSON.parse(jwks)
  return [
    ethers.BigNumber.from(Buffer.from(parsed['e'], 'base64url')), 
    ethers.BigNumber.from(Buffer.from(parsed['n'], 'base64url')),
    parsed['kid']
  ]
}


const [eGoogle, nGoogle, kidGoogle] = jwksKeyToPubkey(`{"kid":"f1338ca26835863f671408f41738a7b49e740fc0","n":"vCk1vqT3qTLWsZ0yyO6T5sHBFUMPI9bcjT9yO94cZUfJjttRV_RMxUgvB-c3o-dx7f4WrM3knYoWn5pmGH6_B3vJbvnTzfnjojaBfsqn8Cdof1mI3N6ZKmhFVWz-Sui65ycb9F2MVw-z0DcZxk_DcBEMG6Jxps9I2_hFm7xkCPjiN2Q8T-MLNhJYnoxBe1VtuyCFFEDAtU5VXIyJEdDoz_MXIR7o8TsQTnX1ZpB4SijtShz4oJXaQGeSb8eb9AgwiOuiFKHndiMaemtEfnIkU4EXZ_MXXLdi0Rq-euA7XVFk-j1jVxRtVOhrz0VIMy2B8g6l817zKHqC3ZIv1PbUVQ","kty":"RSA","e":"AQAB","use":"sig","alg":"RS256"}`)
const [eOrcid, nOrcid, kidOrcid] = jwksKeyToPubkey(`{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}`)
const [eTwitter, nTwitter, kidTwitter] = jwksKeyToPubkey(`{"key_ops":["verify"],"ext":true,"kty":"RSA","n":"oagYTJtXZclWd8TFevkbI_edfB0YoMsiEHKbEagrB3Ao_6pEUnQtJOuIsRM9w9IVtvwKlJZae8hcksoRhzZm9lyueN7XzOO2f8I8bxf-rapWKpM0p83RWKvwTICVi0I72Ev5fIiWEMKbLA3YXIrDVRvtsLeYEvbVfvstwkA8Rla5uMcsPkcO3fc8ONZgArlpnxUqe-fEqjAHIWmDTUOEbvpitCPtYCSqHR7QmGkZ90RByVp5niOBhoMlUlvTRMqu8M_42peQJZdBzhGvNmY1_NgX7DBAdTXwOgWSVwBdfpq8K8yt_v-4l6I_ydnxaBsI5K69l__UdKlaapUrguNB6w","e":"AQAB","alg":"RS256","kid":"oagY"}`)
const [eGithub, nGithub, kidGithub] = jwksKeyToPubkey(`{"key_ops":["verify"],"ext":true,"kty":"RSA","n":"q7wWK3dvPtQpzoS1zDFzVgWf08tZH814Bfx50dJuUzQpE-7D-nxXTbSgKw73K6UWSou_jBdnNtushkhxXI5UpTGBSygI59KyjNIC8dh0n8RoqtXZVR1FWX468CEqfXjUnKEoDx-EzWsJTCabHCmgvU7JefiNfb-430J5T_3jxNyeIk8YozsM-Ib0RlIF_Kv2P6e_jVXflaclW2dUa4eVyWCVc-2REavdQD19fkQ-tIYMjbgMz7LUtFJnWvoH-M5U3y3Q8yWsueGDB1n9BrPII9qcHJm8DqrdzmOf00Ywz7-bpvaMpRnHV622tACcvimLxCG1E_9Hfi2jO0orqCCpUw","e":"AQAB","alg":"RS256","kid":"q7wW"}`)
const [eDiscord, nDiscord, kidDiscord] = jwksKeyToPubkey(`{"key_ops":["verify"],"ext":true,"kty":"RSA","n":"rSA57VMJxdNKprkkzDx869_VzmMcMi_viyXiF_TJpopTeCMqIOSkVeOciyCAIJWX5bMvH4QlpB1ydEO7u9Uu3HMkE1NGuH7_WGd7LVB8Kew4QxBvRu20EgZIFOPT1g161cCp7W4EMBKHTWNCY4qVI2AUFFKfA4atGIlWJHSw4UcULX5xTQN799lGTLP9vStTqeKQFbQZfFAD1IrQbfSSkcRmPsnqHRhFrZ2ccwmzsL4846TSCDjTAEsQGt6jG8gC2Jpqn80SoYLT6PoN6O5gWZfmsBf0RywTE8BU6_umBQBYcZI0OSo6dvYxh_60pNNM5m-ZGbkZNG184PkjA3EzeQ","e":"AQAB","alg":"RS256","kid":"rSA5"}`)

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const idAgg = (await ethers.getContractFactory('IdentityAggregator')).attach('0x4278b0B8aC44dc61579d5Ec3F01D8EA44873b079')
  // const idAgg = await deployIdAggregator();
  // const bios = await deployWTFBios();
  // const orcid = await deployORCID();
  // const google = await deployGoogle();
  // const github = await deployGithub();
  // const twitter = await deployTwitter();
  // const discord  = await deployDiscord();
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
  await deployWTFByteUtils();
}

async function deployWTFByteUtils() {
  const WTFByteUtils = await ethers.getContractFactory('WTFBios')
  const wbus = await WTFByteUtils.deploy();
  await wbus.deployed();
  console.log('WTFByteUtils: ', wbus.address);
  return wbus
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

async function deployGoogle() {
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  let google = await upgrades.deployProxy(VJWT, [eGoogle, nGoogle, kidGoogle, googleBottomBread, googleTopBread], {
    initializer: 'initialize',
  });
  console.log('GOOGLE: ' + google.address);
  return VJWT
}

async function deployORCID(){
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  let orcid = await upgrades.deployProxy(VJWT, [eOrcid, nOrcid, kidOrcid, orcidBottomBread, orcidTopBread], {
    initializer: 'initialize',
  });
  console.log('ORCID: ' + orcid.address);
  return VJWT
}

async function deployTwitter(){
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  let twitter = await upgrades.deployProxy(VJWT, [eTwitter, nTwitter, kidTwitter, twitterBottomBread, twitterTopBread], {
    initializer: 'initialize',
  });
  console.log('TWITTER: ' + twitter.address);
  return VJWT
}

async function deployGithub(){
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  let github = await upgrades.deployProxy(VJWT, [eGithub, nGithub, kidGithub, githubBottomBread, githubTopBread], {
    initializer: 'initialize',
  });
  console.log('GITHUB: ' + github.address);
  return VJWT
}

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
