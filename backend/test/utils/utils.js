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


exports.vmExceptionStr = 'VM Exception while processing transaction: reverted with reason string ';

// Wrapper function to add a getDeploymentParams function
const deployable = (params) => {
  return {
    ...params, 
    getDeploymentParams: ()=> [params.e, params.n, params.kid, params.idBottomBread, params.idTopBread, params.expBottomBread, params.expTopBread, params.audSandwich]
  }
}
exports.orcidParams = deployable({
  e : eOrcid,
  n : nOrcid,
  kid : kidOrcid,
  audSandwich : stringToHex('","aud":"APP-MPLI0FQRUVFEKMYX","'),
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
const sha256FromString = x => ethers.utils.sha256(ethers.utils.toUtf8Bytes(x));
exports.sha256FromString = sha256FromString;

// input: x (string); output: sha256 of string
const keccak256FromString = x => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(x));
exports.keccak256FromString = keccak256FromString;

// Sandwiches data between contract.bottomBread() and contract.topBread(). By default does ID with id bread. If type='exp' is specified, it will sandwich with the expiration bread
const sandwichDataWithBreadFromContract = async (data, contract, type='id') => {
  let bottomBread; 
  let topBread;
  if(type == 'id') {
    bottomBread = await contract.bottomBread()
    topBread = await contract.topBread()
  } else if(type == 'exp') {
    bottomBread = await contract.expBottomBread()
    topBread = await contract.expTopBread()
  } else if(type == 'aud') {
    bottomBread = ''
    topBread = ''
  } else {
    throw new Error(`type "${type}" not recognized`)
  }

  let sandwich = bottomBread + Buffer.from(data).toString('hex') + topBread;
  sandwich = sandwich.replaceAll('0x', '');
  return sandwich
}

exports.sandwichDataWithBreadFromContract = sandwichDataWithBreadFromContract;

// @param {string} address
// @param {string} message
      // Returns two commits: [unbound, bound]. The unbound commit is the hash of the message. The bound commit is the hash of the message concatenated with the address
      // It is important to use the Keccak256 algorithm or any that doesn't rely on the Merkle-Dagmard transform to prevent length extension attacks
const generateCommitments = (address, message) => {
  let addr_ = Buffer.from(address.replace('0x', ''), 'hex')
  let msg_ = Buffer.from(message)
  let unbound = ethers.utils.keccak256(msg_)
  let bound = ethers.utils.keccak256(Buffer.concat([msg_, addr_]))
  return [unbound, bound]
}
exports.generateCommitments = generateCommitments;

// @param {VerifyJWT} vjwt is the VerifyJWT
// @param {string} jwt is the JWT with base64url-encoded header, payload, and signature joined by '.'
// @param {string} idFieldName is the JWT's claim for the id (likely 'sub' or 'email')
exports.getParamsForVerifying = async (vjwt, jwt, idFieldName) => {
      let params = {}; 
      const parsed = parseJWT(jwt)

      params.id = parsed.payload.parsed[idFieldName]
      params.expTimeInt = parsed.payload.parsed.exp
      params.aud = parsed.payload.parsed.aud
      params.expTime = params.expTimeInt.toString()
      

      // Signature of JWT in ethers-compatible format
      params.signature = ethers.BigNumber.from(parsed.signature.decoded)

      // Message and hashedMessage needed for proof (message is header.payload)
      params.message = parsed.header.raw + '.' + parsed.payload.raw
      params.hashedMessage = sha256FromString(params.message)

      // Where payload starts
      params.payloadIdx = Buffer.from(parsed.header.raw).length + 1 //Buffer.from('.').length == 1
  
      // Find ID and exp sandwiches (and make a bad one for testing purposes to make sure it fails)
      const idSandwichValue = await sandwichDataWithBreadFromContract(params.id, vjwt, type='id');
      const expSandwichValue = await sandwichDataWithBreadFromContract(params.expTime, vjwt, type='exp');
      const audSandwichValue = await sandwichDataWithBreadFromContract(params.aud, vjwt, type='aud');
      // Find indices of sandwich in raw payload:
      const idSandwichText = Buffer.from(idSandwichValue, 'hex').toString()
      const expSandwichText = Buffer.from(expSandwichValue, 'hex').toString()
      const audSandwichText = Buffer.from(audSandwichValue, 'hex').toString()

      let startIdxID; let endIdxID; let startIdxExp; let endIdxExp; 
      try {
        [startIdxID, endIdxID] = searchForPlainTextInBase64(idSandwichText, parsed.payload.raw)
      } catch(err) {
        console.error(err)
        console.error(`There was a problem searching for: ${(idSandwichText)} \n in ${Buffer.from(parsed.payload.raw, 'base64').toString()}`)
      }

      try {
        [startIdxExp, endIdxExp] = searchForPlainTextInBase64(expSandwichText, parsed.payload.raw)
      } catch(err) {
        console.error(err)
        console.error(`There was a problem searching for: ${(expSandwichText)} \n in ${Buffer.from(parsed.payload.raw, 'base64').toString()}`)
      }

      try {
        [startIdxAud, endIdxAud] = searchForPlainTextInBase64(audSandwichText, parsed.payload.raw)
      } catch(err) {
        console.error(err)
        console.error(`There was a problem searching for: ${(audSandwichText)} \n in ${Buffer.from(parsed.payload.raw, 'base64').toString()}`)
      }
      
            
      // Generate the actual sandwich struct
      params.proposedIDSandwich = {
        idxStart: startIdxID, 
        idxEnd: endIdxID, 
        sandwichValue: Buffer.from(idSandwichValue, 'hex')
      } 
      params.proposedExpSandwich = {
        idxStart: startIdxExp, 
        idxEnd: endIdxExp, 
        sandwichValue: Buffer.from(expSandwichValue, 'hex')
      } 
      params.proposedAudSandwich = {
        idxStart: startIdxAud, 
        idxEnd: endIdxAud, 
        sandwichValue: Buffer.from(audSandwichValue, 'hex')
      } 

      // Generates a proof to be commited that the entity owning *address* knows the JWT
      // params.generateProof = async (address) => ethers.utils.sha256(
      //                                                                 await xor(Buffer.from(params.hashedMessage.replace('0x', ''), 'hex'), 
      //                                                                           Buffer.from(address.replace('0x', ''), 'hex')
      //                                                                           )
      //                                                     )

      params.generateCommitments = address => generateCommitments(address, params.message)

      params.verifyMeContractParams = () => [
        params.signature, 
        params.message, 
        params.payloadIdx, 
        params.proposedIDSandwich, 
        params.proposedExpSandwich,
        params.proposedAudSandwich
    ]

      const p = params
      return p
}