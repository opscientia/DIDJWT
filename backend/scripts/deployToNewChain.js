
const { ethers } = require("hardhat");

const {
  orcidParams,
  twitterParams,
  githubParams,
  discordParams,
  deployVerifyJWTContractWithCustomFactory,
} = require('../utils.js');


async function main() {
  const wu = await deployWTFUtils();
  const idAgg = await deployIdAggregator();
  const bios = await deployWTFBios();

  const VerifyJWT = await ethers.getContractFactory('VerifyJWTv2', {
    libraries : {
      WTFUtils : wu.address //https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#library-linking for more info on this argument
    }
  })

  for(const s of [
    {name:'twitter', args:await twitterParams.getDeploymentParamsCustomAud('mumbai')},
    {name:'discord', args:await discordParams.getDeploymentParamsCustomAud('mumbai')},
    {name:'github', args:await githubParams.getDeploymentParamsCustomAud('mumbai')},
    {name:'orcid', args:await orcidParams.getDeploymentParamsCustomAud('APP-TUDV82T8W5ZLSB5B')}
  ]){
    const vjwt = await deployVerifyJWTContractWithCustomFactory({factory:VerifyJWT, args: s.args})
    await vjwt.deployed();
    let tx = await idAgg.addVerifyJWTContract(s.name, vjwt.address)
    await tx.wait()
    console.log(s.name, vjwt.address);
  }
  console.log('Done: ', await idAgg.getKeywords())
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


// Hardhat recommends this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
