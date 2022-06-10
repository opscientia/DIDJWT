const { ethers, upgrades } = require('hardhat');
const wtf = require('wtf-lib');
const { fixedBufferXOR, searchForPlainTextInBase64, parseJWT } = require('wtfprotocol-helpers');
const xor = fixedBufferXOR

const hexToString = hx => Buffer.from(hx.replace('0x',''), 'hex').toString()
const stringToHex = str => '0x' + Buffer.from(str).toString('hex')
exports.hexToString = hexToString
exports.stringToHex = stringToHex

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
const [eDiscord, nDiscord, kidDiscord] = jwksKeyToPubkey(`{"key_ops":["verify"],"ext":true,"kty":"RSA","n":"rSA57VMJxdNKprkkzDx869_VzmMcMi_viyXiF_TJpopTeCMqIOSkVeOciyCAIJWX5bMvH4QlpB1ydEO7u9Uu3HMkE1NGuH7_WGd7LVB8Kew4QxBvRu20EgZIFOPT1g161cCp7W4EMBKHTWNCY4qVI2AUFFKfA4atGIlWJHSw4UcULX5xTQN799lGTLP9vStTqeKQFbQZfFAD1IrQbfSSkcRmPsnqHRhFrZ2ccwmzsL4846TSCDjTAEsQGt6jG8gC2Jpqn80SoYLT6PoN6O5gWZfmsBf0RywTE8BU6_umBQBYcZI0OSo6dvYxh_60pNNM5m-ZGbkZNG184PkjA3EzeQ","e":"AQAB","alg":"RS256","kid":"rSA5"}`)


exports.vmExceptionStr = 'VM Exception while processing transaction: reverted with reason string ';

// Wrapper function to add a getDeploymentParams function
const deployable = (params) => {
  return {
    ...params, 
    getDeploymentParams: () => [params.e, params.n, params.kid, params.idBottomBread, params.idTopBread, params.expBottomBread, params.expTopBread, params.aud],
    getDeploymentParamsCustomAud: (aud) => [params.e, params.n, params.kid, params.idBottomBread, params.idTopBread, params.expBottomBread, params.expTopBread, stringToHex(`","aud":"${aud}","`)]
  }
}
exports.orcidParams = deployable({
  e : eOrcid,
  n : nOrcid,
  kid : kidOrcid,
  aud : stringToHex('","aud":"APP-MPLI0FQRUVFEKMYX","'),
  idBottomBread : stringToHex('","sub":"'),
  idTopBread : stringToHex('","auth_time":'),
  expBottomBread : stringToHex('","exp":'),
  expTopBread : stringToHex(',"given_name":'),
})

exports.googleParams = deployable({
  e : eGoogle,
  n : nGoogle,
  kid : kidGoogle,
  aud : stringToHex('","aud":"254984500566-3qis54mofeg5edogaujrp8rb7pbp9qtn.apps.googleusercontent.com","'),
  idBottomBread : stringToHex('","email":"'),
  idTopBread : stringToHex('","email_verified":'),
  expBottomBread : stringToHex(',"exp":'),
  expTopBread : stringToHex(',"jti":"')
})

exports.twitterParams = deployable({
  e : eTwitter,
  n : nTwitter,
  kid : kidTwitter,
  aud : stringToHex('","aud":"gnosis","'),
  idBottomBread : stringToHex('"creds":"'),
  idTopBread : stringToHex('","aud":"'),
  expBottomBread : stringToHex('","exp":"'),
  expTopBread : stringToHex('"}')
})

exports.githubParams = deployable({
  e : eGithub,
  n : nGithub,
  kid : kidGithub,
  aud : stringToHex('","aud":"gnosis","'),
  idBottomBread : stringToHex('"creds":"'),
  idTopBread : stringToHex('","aud":"'),
  expBottomBread : stringToHex('","exp":"'),
  expTopBread : stringToHex('"}')
})

exports.discordParams = deployable({
  e : eDiscord,
  n : nDiscord,
  kid : kidDiscord,
  aud : stringToHex('","aud":"gnosis","'),
  idBottomBread : stringToHex('"creds":"'),
  idTopBread : stringToHex('","aud":"'),
  expBottomBread : stringToHex('","exp":"'),
  expTopBread : stringToHex('"}')
})

let contractAddresses = wtf.getContractAddresses()

exports.upgradeVerifyJWTContract = async (service, wtfutilsAddress=null, forceImport=false) => {
    let wu;
    if(!wtfutilsAddress){
      wu = await (await ethers.getContractFactory('WTFUtils')).deploy()
    } else
    {
      wu = await (await ethers.getContractFactory('WTFUtils')).attach(wtfutilsAddress)
    }
    console.log('utils @', wu.address)
    let address = contractAddresses.VerifyJWT.gnosis[service]
    let VJWT = await ethers.getContractFactory('VerifyJWT')
    let NewVJWT = await ethers.getContractFactory('VerifyJWTv2', {
      libraries : {
        WTFUtils : wu.address //https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#library-linking for more info on this argument
      }, 
    })

    // Import the implementation if it's not already loaded:
    if(forceImport) {
      await upgrades.forceImport(
        address,
        VJWT, 
        {kind : 'uups'}, 
      )
    }

    let vjwt = await upgrades.upgradeProxy(address, NewVJWT, { unsafeAllow: ['external-library-linking'] }) //WARNING: ALLOWING LIBRARIES (but this should be fine as long as lib can't call selfdestruct) https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-external-libraries
    // Note: owner still needs to set the bottombread and topbread for exp if going from v1 to v2 or v3
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

exports.deployVerifyJWTContractWithCustomFactory = async (obj) => {
  let VerifyJWT = obj.factory
  let args = obj.args //arguments for deploying
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
