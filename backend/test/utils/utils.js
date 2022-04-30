const { ethers, upgrades } = require('hardhat');
const wtf = require('wtf-lib');

// Converts JWKS RSAkey to e, n, and kid:
const jwksKeyToPubkey = (jwks) => {
  let parsed = JSON.parse(jwks)
  return [
    ethers.BigNumber.from(Buffer.from(parsed['e'], 'base64url')), 
    ethers.BigNumber.from(Buffer.from(parsed['n'], 'base64url')),
    parsed['kid']
  ]
}
exports.jwksKeyToPubkey = jwksKeyToPubkey;
const [eOrcid, nOrcid, kidOrcid] = jwksKeyToPubkey('{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}')
const [eGoogle, nGoogle, kidGoogle] = jwksKeyToPubkey('{"n":"qR7fa5Gb2rhy-RJCJwSFn7J2KiKs_WgMXVR-23Z6OfX89_utHGkM-Qk27abDGPXa0u9OKzwOU2JZx7yNye7LH4kKX1PEAEz0p9XGbfF3yFyiD5JkziOfQyYj9ERKWfxKatpk-oi9D_p2leQKzTfEZWIfLVZkgNXFkUdhzCG68j5kFhZ1Ys9bRRDo3Q1BkLXmP_Y6PW1g74_rvAYCiQ6hJVvyyXYnqHcoawedgO6_MQihaSeAW25AhY8MXVo4-MdNvboahOlJg280YuxkCZiRqxyQEqd5HKCPzP49TDQbdAxDa900ewCQK9gkbHiNKFbOBv_b94YfMh93NUoEa-jCnw","use":"sig","e":"AQAB","kty":"RSA","alg":"RS256","kid":"861649e450315383f6b9d510b7cd4e9226c3cd88"}')
const [eTwitter, nTwitter, kidTwitter] = jwksKeyToPubkey(`{"key_ops":["verify"],"ext":true,"kty":"RSA","n":"oagYTJtXZclWd8TFevkbI_edfB0YoMsiEHKbEagrB3Ao_6pEUnQtJOuIsRM9w9IVtvwKlJZae8hcksoRhzZm9lyueN7XzOO2f8I8bxf-rapWKpM0p83RWKvwTICVi0I72Ev5fIiWEMKbLA3YXIrDVRvtsLeYEvbVfvstwkA8Rla5uMcsPkcO3fc8ONZgArlpnxUqe-fEqjAHIWmDTUOEbvpitCPtYCSqHR7QmGkZ90RByVp5niOBhoMlUlvTRMqu8M_42peQJZdBzhGvNmY1_NgX7DBAdTXwOgWSVwBdfpq8K8yt_v-4l6I_ydnxaBsI5K69l__UdKlaapUrguNB6w","e":"AQAB","alg":"RS256","kid":"oagY"}`)
const [eGithub, nGithub, kidGithub] = jwksKeyToPubkey(`{"key_ops":["verify"],"ext":true,"kty":"RSA","n":"q7wWK3dvPtQpzoS1zDFzVgWf08tZH814Bfx50dJuUzQpE-7D-nxXTbSgKw73K6UWSou_jBdnNtushkhxXI5UpTGBSygI59KyjNIC8dh0n8RoqtXZVR1FWX468CEqfXjUnKEoDx-EzWsJTCabHCmgvU7JefiNfb-430J5T_3jxNyeIk8YozsM-Ib0RlIF_Kv2P6e_jVXflaclW2dUa4eVyWCVc-2REavdQD19fkQ-tIYMjbgMz7LUtFJnWvoH-M5U3y3Q8yWsueGDB1n9BrPII9qcHJm8DqrdzmOf00Ywz7-bpvaMpRnHV622tACcvimLxCG1E_9Hfi2jO0orqCCpUw","e":"AQAB","alg":"RS256","kid":"q7wW"}`)


exports.vmExceptionStr = 'VM Exception while processing transaction: reverted with reason string ';

exports.orcidParams = {
  e : eOrcid,
  n : nOrcid,
  kid : kidOrcid,
  idBottomBread : '0x222c22737562223a22',
  idTopBread : '0x222c22617574685f74696d65223a',
  expBottomBread : '0x222c22657870223a',
  expTopBread : '0x2c22676976656e5f6e616d65223a'
}

exports.googleParams = {
  e : eGoogle,
  n : nGoogle,
  kid : kidGoogle,
  idBottomBread : '0x222c22656d61696c223a22',
  idTopBread : '0x222c22656d61696c5f7665726966696564223a',
  expBottomBread : '0x2c22657870223a',
  expTopBread : '0x2c226a7469223a22'
}

exports.twitterParams = {
  e : eTwitter,
  n : nTwitter,
  kid : kidTwitter,
  idBottomBread : '0x226372656473223a22',
  idTopBread : '0x222c22617564223a22676e6f736973222c22',
  expBottomBread : '0x222c22657870223a22',
  expTopBread : '0x227d'
}

exports.githubParams = {
  e : eGithub,
  n : nGithub,
  kid : kidGithub,
  idBottomBread : '0x226372656473223a22',
  idTopBread : '0x222c22617564223a22676e6f736973222c22',
  expBottomBread : '0x222c22657870223a22',
  expTopBread : '0x227d'
}

let contractAddresses = wtf.getContractAddresses()

exports.upgradeVerifyJWTContract = async (service) => {
    let wu = await (await ethers.getContractFactory('WTFUtils')).deploy()
    let address = contractAddresses.VerifyJWT.gnosis[service]
    let VJWT = await ethers.getContractFactory('VerifyJWT')
    let NewVJWT = await ethers.getContractFactory('VerifyJWTv2', {
      libraries : {
        WTFUtils : wu.address //https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#library-linking for more info on this argument
      }, 
    })

    // Import the implementation if it's not already loaded:
    await upgrades.forceImport(
      address,
      VJWT, 
      {kind : 'uups'}, 
    )

    let vjwt = await upgrades.upgradeProxy(address, NewVJWT, { unsafeAllow: ['external-library-linking'] }) //WARNING: ALLOWING LIBRARIES (but this should be fine as long as lib can't call selfdestruct) https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-external-libraries
    // Note: owner still needs to set the bottombread and topbread for exp if going from v1 to v2
    return vjwt
}

exports.deployVerifyJWTContract = async (...args) => {
  let wu = await (await ethers.getContractFactory('WTFUtils')).deploy()
  const VerifyJWT = await ethers.getContractFactory('VerifyJWTv2', {
    libraries : {
      WTFUtils : wu.address //https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#library-linking for more info on this argument
    }
  })
  const vjwt = await upgrades.deployProxy(
    VerifyJWT, 
    args, {
      kind: 'uups',
      initializer: 'initialize', 
      unsafeAllow: ['external-library-linking']    //WARNING: ALLOWING LIBRARIES (but this should be fine as long as lib can't call selfdestruct) https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-external-libraries
    },
  );
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

