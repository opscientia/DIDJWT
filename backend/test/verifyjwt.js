const { expect, assert } = require('chai');
const { ethers, upgrades } = require('hardhat');
const { searchForPlainTextInBase64 } = require('wtfprotocol-helpers');
// const { expectEvent } = require('@openzeppelin/test-helpers'); //this is an amazing library i wish i knew b4 writing all this

const {
  orcidParams,
  googleParams,
  twitterParams,
  githubParams,
  deployVerifyJWTContract,
  upgradeVerifyJWTContract,
  sha256FromString,
  keccak256FromString,
  sandwichDataWithBreadFromContract,
  jwksKeyToPubkey,
  vmExceptionStr,
  generateCommitments,
  getParamsForVerifying
} = require('./utils/utils');

const xor = require('wtfprotocol-helpers').fixedBufferXOR;

const upgradeMode = true//(process.argv.length > 3) && (process.argv[3] == '--upgrade')

// describe('Integration test 2', function () {
//   it('Go through full process and make sure it success with a correct JWT', async function () {
//     const [owner, addr1] = await ethers.getSigners()

//     const orig = 'access_token=117a16aa-f766-4079-ba50-faaf0a09c864&token_type=bearer&expires_in=599&tokenVersion=1&persistent=true&id_token=eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A&tokenId=254337461'
//     let parsedToJSON = {}
//     orig.split('&').map(x=>{let [key, value] = x.split('='); parsedToJSON[key] = value});
//     let [headerRaw, payloadRaw, signatureRaw] = parsedToJSON['id_token'].split('.');
//     // let [header, payload] = [headerRaw, payloadRaw].map(x => JSON.parse(atob(x)));
//     let [signature] = [Buffer.from(signatureRaw, 'base64url')]
//     const pubkey = JSON.parse('{"keys":[{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}]}')
//     const [e, n] = [
//       ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['e'], 'base64url')), 
//       Buffer.from(pubkey.keys[0]['n'], 'base64url')
//     ]


//     let vjwt = await deployVerifyJWTContract(eOrcid, nOrcid);
//     let message = headerRaw + '.' + payloadRaw
//     let publicHashedMessage = keccak256FromString(message)
//     let secretHashedMessage = sha256FromString(message)
//     let proof = await vjwt.XOR(secretHashedMessage, owner.address)

//     await vjwt.commitJWTProof(proof, publicHashedMessage)
//     await ethers.provider.send('evm_mine')  
//     await expect(vjwt.verifyMeWithReadableID(ethers.BigNumber.from(signature), message, 288/2, 364/2, '0000-0002-2308-9517')).to.emit(vjwt, 'JWTVerification').withArgs(true);
//     // await expect(vjwt.verifyMeWithReadableID(ethers.BigNumber.from(signature), message)).to.emit(vjwt, 'KeyAuthorization').withArgs(true); 
//     // await expect(vjwt.verifyMeWithReadableID(ethers.BigNumber.from(signature), message.replace('a', 'b'))).to.be.revertedWith('Verification of JWT failed');
    
//   });
// });

describe('handleKeyRotation', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.initialExponent = 9
    this.initialModulus = 37
    this.initialKid = 'someKeyId'
    this.vjwt = await deployVerifyJWTContract(this.initialExponent, this.initialModulus, this.initialKid, orcidParams.idBottomBread, orcidParams.idTopBread, orcidParams.expBottomBread, orcidParams.expTopBread, orcidParams.aud)
  });

  it('Should update kid, e, and n', async function () {
    expect(await this.vjwt.callStatic.kid()).to.equal(this.initialKid)
    expect(await this.vjwt.callStatic.e()).to.equal(this.initialExponent)
    expect(parseInt(await this.vjwt.callStatic.n(), 16)).to.equal(this.initialModulus)

    const newE = 11;
    const newM = 59;
    await this.vjwt.handleKeyRotation(newE, newM, orcidParams.kid)
    expect(await this.vjwt.callStatic.kid()).to.equal(orcidParams.kid)
    expect(await this.vjwt.callStatic.e()).to.equal(newE)
    expect(parseInt(await this.vjwt.callStatic.n(), 16)).to.equal(newM)
  });
});

// Does not really need to be tested (meaning i removed that function to reduce contract size lol so it can't be tested):
// describe('type conversion and cryptography', function (){
//   before(async function(){
//     [this.owner] = await ethers.getSigners();
//     this.vjwt = await deployVerifyJWTContract(11,59, orcidParams.idBottomBread, orcidParams.idTopBread, orcidParams.expBottomBread, orcidParams.expTopBread)
//     this.message = 'Hey'
//   });

//   it('sha256 hashing gives the same result on chain and frontend', async function () {
//     const publicHashedMessage = keccak256FromString(this.message)
//     const secretHashedMessage = sha256FromString(this.message)  
//     expect(await this.vjwt.testSHA256OnJWT(this.message)).to.equal(secretHashedMessage)
//   });
// });

describe('Verify test RSA signatures', function () {
  // Helper function for these tests -- checks whether the transaction causes a JWTVerification event from *any* contract
  const emitsJWTVerificationEventWithValue = async (tx, value) => 
  {
    assert(typeof value === 'boolean');
    let val = value ? '0x0000000000000000000000000000000000000000000000000000000000000001' : '0x0000000000000000000000000000000000000000000000000000000000000000'
    let events = (await tx.wait()).events
    expect(
      events.some(e=> (e.topics.includes(keccak256FromString('JWTVerification(bool)')) && (e.data === val)))
    ).to.equal(true)
  }



  it('Verify with a real JWT', async function () {
    const orig = 'access_token=117a16aa-f766-4079-ba50-faaf0a09c864&token_type=bearer&expires_in=599&tokenVersion=1&persistent=true&id_token=eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A&tokenId=254337461'
    let parsedToJSON = {}
    orig.split('&').map(x=>{let [key, value] = x.split('='); parsedToJSON[key] = value});
    let [headerRaw, payloadRaw, signatureRaw] = parsedToJSON['id_token'].split('.');
    let [signature, badSignature] = [Buffer.from(signatureRaw, 'base64url'), Buffer.from(signatureRaw.replace('a','b'), 'base64url')]

    let vjwt = await deployVerifyJWTContract(...orcidParams.getDeploymentParams())
    
    
    await emitsJWTVerificationEventWithValue(
      await vjwt.verifyJWT(ethers.BigNumber.from(signature), headerRaw + '.' + payloadRaw),
      true
    );

    // make sure it doesn't work with wrong JWT or signature:
    await emitsJWTVerificationEventWithValue(
      await vjwt.verifyJWT(ethers.BigNumber.from(signature), headerRaw + ' : )' + payloadRaw),
      false
    );
    await emitsJWTVerificationEventWithValue(
      await vjwt.verifyJWT(ethers.BigNumber.from(badSignature), headerRaw + '.' + payloadRaw),
      false
    );
  });
})

describe('proof of prior knowledge', function () {
  beforeEach(async function(){
    [this.owner, this.addr1] = await ethers.getSigners();
    this.vjwt = await deployVerifyJWTContract(11,230, 'example kid :) :) :)', orcidParams.idBottomBread, orcidParams.idTopBread, orcidParams.expBottomBread, orcidParams.expTopBread, orcidParams.aud)
    this.message1 = 'Hey' 
    this.message2 = 'Hey2'
    
    this.proof1 = generateCommitments(this.owner.address, this.message1)
    this.proof2 = generateCommitments(this.owner.address, this.message2)
    
  })
  it('Can prove prior knowledge of message', async function () {
    await this.vjwt.commitJWTProof(...this.proof1)
    await ethers.provider.send('evm_mine')
    expect(await this.vjwt['checkCommit(address,string)'](this.owner.address, this.message1)).to.equal(true)
  });

  it('Cannot prove prior knowledge of message in one block', async function () {
    await this.vjwt.commitJWTProof(...this.proof1)
    await expect(this.vjwt['checkCommit(address,string)'](this.owner.address, this.message1)).to.be.revertedWith(vmExceptionStr + "'You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun'");
  });

  it('Cannot prove prior knowledge of different message', async function () {
    await this.vjwt.commitJWTProof(...this.proof1)
    await ethers.provider.send('evm_mine')
    await expect(this.vjwt['checkCommit(address,string)'](this.owner.address, this.message2)).to.be.revertedWith(vmExceptionStr + "'Proof not found; it needs to have been submitted to commitJWTProof in a previous block'");
  });

  it('Different address fails commitment check', async function () {
    await this.vjwt.commitJWTProof(...this.proof1)
    await ethers.provider.send('evm_mine')
    await expect(this.vjwt['checkCommit(address,string)']('0x483293fCB4C2EE29A02D74Ff98C976f9d85b1AAd', this.message1)).to.be.revertedWith(vmExceptionStr + "'Your address was not bound with the original commit'");
  });
});

describe('Frontend sandwiching', function(){
  it('Test that correct sandwich is given for a specific ID', async function(){
    let vjwt = await deployVerifyJWTContract(50,100, 'abcde', orcidParams.idBottomBread, orcidParams.idTopBread, orcidParams.expBottomBread, orcidParams.expTopBread, orcidParams.aud);
    expect(await sandwichDataWithBreadFromContract('0000-0002-2308-9517', vjwt, type='id')).to.equal('222c22737562223a22303030302d303030322d323330382d39353137222c22617574685f74696d65223a');
  });
});

// TODO: move sandwich testing from integration test to unit test. In VerifyJWTv2, sandwich verification is now a separate function that can be tested independently from the verifyMe function
// The new function is bytesIncludeSandwichAt
// This is low priority as it's already tested and will be caught in integration tests if it is inappropriately altered.

for (const params of [
  {
    ...orcidParams,
    name : 'orcid',
    expiredToken: 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A',
    newToken: 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoibG9lOGFqMjFpTXEzMVFnV1NEOXJxZyIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY1MTI3NzIxOCwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY1MTM3NTgzMywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjUxMjg5NDMzLCJub25jZSI6IndoYXRldmVyIiwiZmFtaWx5X25hbWUiOiJLaGFsc2EiLCJqdGkiOiI1YmEwYTkxNC1kNWYxLTQ2NzUtOGI5MS1lMjkwZjc0OTI3ZDQifQ.Q8B5cmh_VpaZaQ-gHIIAtmh1RlOHmmxbCanVIxbkNU-FJk8SH7JxsWzyhj1q5S2sYWfiee3eT6tZJdnSPInGYdN4gcjCApJAk2eZasm4VHeiPCBHeMyjNQ0w_TZJFhY0BOe7rES23pwdrueEqMp0O5qqFV0F0VTJswyy-XMuaXwoSB9pkHFBDS9OUDAiNnwYakaE_lpVbrUHzclak_P7NRxZgKlCl-eY_q7y0F2uCfT2_WY9_TV2BrN960c9zAMQ7IGPbWNwnvx1jsuLFYnUSgLK1x_TkHOD2fS9dIwCboB-pNn8B7OSI5oW7A-aIXYJ07wjHMiKYyBu_RwSnxniFw',
    idFieldName : 'sub',
    id : '0000-0002-2308-9517',
    expTime : '1651375833',
    createContract : async() => await deployVerifyJWTContract(...orcidParams.getDeploymentParams())
                       
  },
  {
    ...googleParams,
    name : 'google',
    expiredToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjcyOTE4OTQ1MGQ0OTAyODU3MDQyNTI2NmYwM2U3MzdmNDVhZjI5MzIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiMDREZXRTaGNSYUE4OWxlcEQzdWRnUSIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjQ3NjYzNDk4LCJleHAiOjE2NDc2NjcwOTgsImp0aSI6IjE4ZmRmMGQ2M2VhYjI4YjRlYmY0NmFiMDMzZTM5OTU3NmE5MTJlZGUifQ.YqmOub03zNmloAcFvZE0E-4Gt2Y5fr_9XQLUYqXQ24X_GJaJh0HSQXouJeSXjnk8PT6E1FnPd89QAgwDvE_qxAoOvW7VKDycVapOeDtKdTQ-QpAn-ExE0Pvqgx1iaGRZFDS4DWESX1ZsQIBAB_MHK_ZFdAnOjeFzImuMkB1PZLY99przSaM8AEyvWn8wfEgdmkdoJERBXF7xJI2dfA9mTRjlQvhSC4K060bTJbUYug4sQLrvo53CsDjvXRnodnCB81EVWZUbf5B9dG__kebI3AjedKUcPb2wofpX_B7uAyVlD7Au3APEbZP7Asle0Bi76hDNGPQbLvR_nGWLoySfCQ',
    newToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg2MTY0OWU0NTAzMTUzODNmNmI5ZDUxMGI3Y2Q0ZTkyMjZjM2NkODgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoidDZqVl9BZ0FyTGpuLXFVSlN5bUxoZyIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjUxMzQ5MjczLCJleHAiOjE2NTEzNTI4NzMsImp0aSI6IjA3NTU4ODdlOTI3MzA1ZTY0Y2E4MWVhMzE3YjYxZGQxYWJjNWFiZjgifQ.PXrelpQdJkTxbQw66p6HaSGT5pR6qhkZ8-04hLnVhmrzOJLBkyYisWHzP1t96IWguswMZ4tafg2uCCnra2zkz6BMiBCPrGJdk0l_Kx06FJMX-QNVdt5hW28qM6il94eb0g_OTHCmI28eUJf1rNY8D5NMrG3kXWPDQ8_EkOyySVbu6ED1XFbYgHzo560Ty1-gkQRQKYCuogqrcDBRPF3tqXyg9itCHawm6Kll_GX1TP5zwnwtr5WVrAFYtLJV1_VAEfKWkdU6v6LkAgq4ZjzunFRWBclLVCS2X1JO8iBeGjl_LVVoycvxwojrlZigplQAUSsxmDjlQ4VLH9vINiid6Q',
    idFieldName : 'email',
    id : 'nanaknihal@gmail.com',
    expTime : '1651352873',
    createContract : async() => await deployVerifyJWTContract(...googleParams.getDeploymentParams())
  },
  {
    ...twitterParams,
    name : 'twitter',
    newToken : 'eyJraWQiOiJvYWdZIn0.eyJjcmVkcyI6IlByb3RvY29sV3RmIiwiYXVkIjoiZ25vc2lzIiwicmFuZCI6IlMzS1I3WGtfUkc3R0tBYlVHQ2JiNHQ4all1UkhLVmpnc0FTeFYwME9zY1UiLCJleHAiOiIxNjUxMzY1MjUzIn0.WOUI40Dk4bZKszkgfBHsc3Bc0SAQ_cdB6W3F-oGmmY0FhMLfTiVvAFkNIOES_FAUfQlNqq47Gt-THrr6EMcNkOrC6W0nEYjHYn-VByE7xxRdZtSXS_OYDbw8bLQEeaNjcUnJZQ0HYXA0uy4JDNJKbhJCCcrEcK187vbqazpzSZ_tCgbSeqHCmwnakg5obqjrCslehJI8w_aSjEiewUB-fOtTz6S92KvDoozUzli6MjapNDQ8j-kz6wuDpM3EigRdjU8n60xqY0pOeiC8r-AHqPa6bh0ws7f7xrkki2gE0t4eiKEKjWHHKvjf9bgRKtj9G9PRTQVOS1fqF6BBCrqqHQ==',
    idFieldName : 'nanaknihal@gmail.com',
    idFieldName : 'creds', 
    id : 'ProtocolWtf',
    expTime : '1651365253',
    createContract : async() => await deployVerifyJWTContract(...twitterParams.getDeploymentParams())
  },
  {
    ...githubParams,
    name : 'github',
    newToken : 'eyJraWQiOiJxN3dXIn0.eyJjcmVkcyI6Ind0ZmlzYWhvbG8iLCJhdWQiOiJnbm9zaXMiLCJyYW5kIjoiYUpXWkg1YWNVMG1SVmFxQUlSRklNbkhoRk9SWHFnS3J5a3MyTWE0Z2p5YyIsImV4cCI6IjE2NTEzNjgxNjUifQ.cClFRCWiL5XismMTWV6gvmLeBASalVP1_xQCLhmHC2W6QwRAxb-uiKvZ0KhNykLFsHJGgsblG7pknbHqoty9H2K2ZJy1jmKRRyw1EAI2UEZSHY7KjmNGI5DEoIf8tC_4UEjOl82_VXujGzmK0byXhCRXvV728TQHuhOy_IP1qvUY1Idhe4tEnK-ysx-chimRgzbx5TOGBc9-miuRMR63qZ_W6J2sB-GKGzNregMzD-qRaSzuEE-ItB51zxJo-wK3kLb1VyP94DfgyOmBNg-AI-lb0N1bp1iF0lwUbx9dngkXdgSQhDSjp45DQM1X8aiMdDoyVtpopxSeoV452JvUtw==',
    id : 'wtfisaholo',
    idFieldName : 'creds', 
    expTime : '1651368165',
    createContract : async() => await deployVerifyJWTContract(...githubParams.getDeploymentParams())
  }
]){

  describe('Integration tests for after successful proof commit with params ' + params.name, function () {
    beforeEach(async function(){
      [this.owner, this.addr1] = await ethers.getSigners()
      this.vjwt = await params.createContract();
      await this.vjwt.changeSandwich(params.idBottomBread, params.idTopBread, params.expBottomBread, params.expTopBread)
      await this.vjwt.changeAud(params.aud)
      this.wrongIDSandwichValue = await sandwichDataWithBreadFromContract('0200-0002-2308-9517', this.vjwt, type='id');
      this.wrongExpSandwichValue = await sandwichDataWithBreadFromContract('1651375834', this.vjwt, type='exp');
      this.verificationParams = await getParamsForVerifying(this.vjwt, params.newToken, params.idFieldName)
      this.pv = this.verificationParams

      await this.vjwt.commitJWTProof(...this.verificationParams.generateCommitments(this.owner.address))
      await ethers.provider.send('evm_mine')
    });
    

    // NOTE should be unit test
    // it('Expired JWT does not work', async function () {
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.proposedIDSandwich, this.proposedExpSandwich)).to.be.revertedWith('JWT is expired');
    //   await ethers.provider.send('evm_setNextBlockTimestamp', [parseInt(params.expTime) - 1000])
    //   await ethers.provider.send('evm_mine')
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.proposedIDSandwich, this.proposedExpSandwich)).to.emit(this.vjwt, 'JWTVerification').withArgs(true);
    // });

    it('Valid JWT works once but cannot be used twice', async function () {
      // TODO: somehow test the JWT cannot be used twice in any circumstance, even after many verifications and changes. Otherwise user can be impersonated
      await expect(this.vjwt.verifyMe(...this.pv.verifyMeContractParams())).to.not.be.reverted
      await expect(this.vjwt.verifyMe(...this.pv.verifyMeContractParams())).to.be.revertedWith('JWT can only be used on-chain once')
    });

    it('Wrong message fails', async function () {
      await expect(
        this.vjwt.verifyMe(
          this.pv.signature, 
          this.pv.message.replace('a', 'b'), 
          this.pv.payloadIdx, 
          this.pv.proposedIDSandwich, 
          this.pv.proposedExpSandwich,
          this.pv.proposedAud
        )
      ).to.be.revertedWith('Verification of JWT failed');
    });

    it('Wrong sandwich fails', async function () {
      await expect(this.vjwt.verifyMe(
          this.pv.signature, 
          this.pv.message, 
          this.pv.payloadIdx, 
          {...this.pv.proposedIDSandwich, sandwichValue: Buffer.from(this.pv.proposedIDSandwich.sandwichValue+0xabc)}, 
          this.pv.proposedExpSandwich,
          this.pv.proposedAud
        )
      ).to.be.revertedWith('Failed to find correct top bread in sandwich');

      // Yes, this could be more comprehensive but testing for top bread in ID sandwich and bottom bread in exp sandwich is enough IMO...for now.
      await expect(this.vjwt.verifyMe(
          this.pv.signature, 
          this.pv.message, 
          this.pv.payloadIdx, 
          this.pv.proposedIDSandwich, 
          {...this.pv.proposedExpSandwich, sandwichValue: Buffer.from(0xabc+this.pv.proposedExpSandwich.sandwichValue)},
          this.pv.proposedAud
        )
      ).to.be.revertedWith('Failed to find correct bottom bread in sandwich');

      await expect(this.vjwt.verifyMe(
          this.pv.signature, 
          this.pv.message, 
          this.pv.payloadIdx, 
          {...this.pv.proposedIDSandwich, sandwichValue: Buffer.from(this.wrongIDSandwichValue, 'hex')},
          this.pv.proposedExpSandwich,
          this.pv.proposedAud
        )
      ).to.be.revertedWith('Proposed sandwich not found');
      
      await expect(this.vjwt.verifyMe(
          this.pv.signature, 
          this.pv.message, 
          this.pv.payloadIdx, 
          this.pv.proposedIDSandwich, 
          {...this.pv.proposedExpSandwich, sandwichValue: Buffer.from(this.wrongExpSandwichValue, 'hex')},
          this.pv.proposedAud
        )
      ).to.be.revertedWith('Proposed sandwich not found');
      
    });

    it('Creds lookup works', async function () {
      let registeredAddresses, registeredCreds;
  
      [registeredAddresses, registeredCreds] = [await this.vjwt.getRegisteredAddresses(), await this.vjwt.getRegisteredCreds()];
      expect(registeredAddresses.length).to.equal(0);
      expect(registeredCreds.length).to.equal(0);
      expect(await this.vjwt.addressForCreds(Buffer.from('0000-0002-2308-9517'))).to.equal(ethers.constants.AddressZero);
  
      await this.vjwt.verifyMe(...this.pv.verifyMeContractParams());
      
      [registeredAddresses, registeredCreds] = [await this.vjwt.getRegisteredAddresses(), await this.vjwt.getRegisteredCreds()];
      expect(registeredAddresses.length).to.equal(1);
      expect(registeredCreds.length).to.equal(1);
      expect(await this.vjwt.addressForCreds(Buffer.from(params.id))).to.include(this.owner.address);
      
      expect(registeredAddresses[0] === this.owner.address).to.equal(true);
    });

    /* This is not too important to test and is now quite tedious to rewrite so i commented it
    // it('Wrong indices fail', async function () {
    //   let [badIdSandwich0, badIdSandwich1] = [this.proposedIDSandwich, this.proposedIDSandwich]
    //   let [badExpSandwich0, badExpSandwich1] = [this.proposedExpSandwich, this.proposedExpSandwich]
    //   badIdSandwich0
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx - 1, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx + 1, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx + 1, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   if(this.startIdx > 0){
    //     await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx - 1, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   }
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx + 1, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx - 1, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    // });

    
  // TODO: add tests for address => creds,  address => JWT,  JWT => address
  */

  });
}   


// describe('Anonymous proof commit', function () {
//   before(async function(){
//     [this.owner, this.addr1] = await ethers.getSigners()

//     const orig = 'access_token=117a16aa-f766-4079-ba50-faaf0a09c864&token_type=bearer&expires_in=599&tokenVersion=1&persistent=true&id_token=eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A&tokenId=254337461'
//     let parsedToJSON = {}
//     orig.split('&').map(x=>{let [key, value] = x.split('='); parsedToJSON[key] = value});
//     let [headerRaw, payloadRaw, signatureRaw] = parsedToJSON['id_token'].split('.');
//     // let [header, payload] = [headerRaw, payloadRaw].map(x => JSON.parse(atob(x)));
//     // let payload = atob(payloadRaw);
//     this.signature = Buffer.from(signatureRaw, 'base64url')
//     this.vjwt = await deployVerifyJWTContract(eOrcid, nOrcid, orcidParams.idBottomBread, orcidParams.idTopBread, orcidParams.expBottomBread, orcidParams.expTopBread);
//     this.message = sha256FromString(headerRaw + '.' + payloadRaw)
//     this.payloadIdx = Buffer.from(headerRaw).length + 1 //Buffer.from('.').length == 1
//     this.sandwich = await sandwichIDWithBreadFromContract('0000-0002-2308-9517', this.vjwt);
//     this.wrongSandwich = await sandwichIDWithBreadFromContract('0200-0002-2308-9517', this.vjwt);
//     // find indices of sandwich in raw payload:
//     let [startIdx, endIdx] = searchForPlainTextInBase64(Buffer.from(this.sandwich, 'hex').toString(), payloadRaw)
//     this.startIdx = startIdx; this.endIdx = endIdx
//     // let publicHashedMessage = keccak256FromString(this.message)
//     // let secretHashedMessage = sha256FromString(this.message)
//     let hashedMessage = sha256FromString(this.message)
//     let proof = ethers.utils.sha256(await xor(hashedMessage, this.owner.address))
//     await this.vjwt.commitJWTProof(proof)
//     await ethers.provider.send('evm_mine')
//   });
//   it('jfakjfak', async function (){
//   })
// });


// This must be at the end, as it changes EVM time for all tests
describe('JWT Expiration', function (){
  beforeEach(async function(){
      // -------- Contract setup: deploy contract and submit JWT proof ---------
      [this.owner, this.addr1] = await ethers.getSigners();
      this.vjwt = await deployVerifyJWTContract(...orcidParams.getDeploymentParams());
      this.jwt1 = 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoibG9lOGFqMjFpTXEzMVFnV1NEOXJxZyIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY1MTI3NzIxOCwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY1MTM3NTgzMywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjUxMjg5NDMzLCJub25jZSI6IndoYXRldmVyIiwiZmFtaWx5X25hbWUiOiJLaGFsc2EiLCJqdGkiOiI1YmEwYTkxNC1kNWYxLTQ2NzUtOGI5MS1lMjkwZjc0OTI3ZDQifQ.Q8B5cmh_VpaZaQ-gHIIAtmh1RlOHmmxbCanVIxbkNU-FJk8SH7JxsWzyhj1q5S2sYWfiee3eT6tZJdnSPInGYdN4gcjCApJAk2eZasm4VHeiPCBHeMyjNQ0w_TZJFhY0BOe7rES23pwdrueEqMp0O5qqFV0F0VTJswyy-XMuaXwoSB9pkHFBDS9OUDAiNnwYakaE_lpVbrUHzclak_P7NRxZgKlCl-eY_q7y0F2uCfT2_WY9_TV2BrN960c9zAMQ7IGPbWNwnvx1jsuLFYnUSgLK1x_TkHOD2fS9dIwCboB-pNn8B7OSI5oW7A-aIXYJ07wjHMiKYyBu_RwSnxniFw';
      this.jwt2 = 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiXzRCMzFzeTJpQWM0ajVvcXEwQ2JVUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMTgtNDQ3NyIsImF1dGhfdGltZSI6MTY1MTI4MTE4NCwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY1MTM2NzcwNCwiZ2l2ZW5fbmFtZSI6IlNoYWR5IiwiaWF0IjoxNjUxMjgxMzA0LCJub25jZSI6IndoYXRldmVyIiwiZmFtaWx5X25hbWUiOiJFbCBEYW1hdHkiLCJqdGkiOiI0ZDFjOTA1YS04Y2UyLTQ3ODEtYTYyYy02YzRlOGE5MzljZDQifQ.Lg2Nd95rrNORAJUjb94YJlbf1bi-Sko2Lwlk4zBcGeCnn0hEJPn38GmvQ7qIu0veY3drKbOrlhPn76icBcafa9Yk-GVc80QIfhYPL-aK7FsVBpkPQT6k1pLPnX-pHFBKquIbmKYdcO-PYRZXp2g_BZIm0GrX9bFNiS8pEm0PhkDKbF7fksuZ5ZpgWARgFip_KU9z5Q9tuaSWljCUr5IN0_-I4g6Qd3SJQ4hF3tA_ekDDaOoDdZHTSvJNsPQEmV9YAC_TDMwsrLwu0tD2A8fIb-ryRpKnJiuAdOmYdjEVVIetGR6CLwew5_GIk_1rYPgKxRCJqTa4T5aP0YVGFvi5sg';
      this.pv1 = await getParamsForVerifying(this.vjwt, this.jwt1, 'sub')
      this.pv2 = await getParamsForVerifying(this.vjwt, this.jwt2, 'sub')

      this.ownerCommits = this.pv1.generateCommitments(this.owner.address)
      this.addr1Commits = this.pv2.generateCommitments(this.addr1.address)

      await this.vjwt.commitJWTProof(...this.ownerCommits)
      // await this.vjwt.connect(this.addr1).commitJWTProof(...addr1Commits)
      await ethers.provider.send('evm_mine')
  });

  it('Expired JWT is not accepted for an existing user with a credential', async function () {
    // Verify the original credential
    await this.vjwt.verifyMe(...this.pv1.verifyMeContractParams())
    
    // Fast-forward 
    await ethers.provider.send('evm_setNextBlockTimestamp', [this.pv1.expTimeInt + 10000000])
    await ethers.provider.send('evm_mine')

    // Set up commit with new credential 
    let newOwnerCommit = this.pv2.generateCommitments(this.owner.address)
    await this.vjwt.commitJWTProof(...newOwnerCommit)
    await ethers.provider.send('evm_mine')
    
    // Now, fail the next verification due to timestamp being too early
    await expect(
        this.vjwt.verifyMe(...this.pv2.verifyMeContractParams())
    ).to.be.revertedWith(vmExceptionStr + "'JWT is expired'")
     
  });

  it('Expired JWT is not accepted for new user without a credential', async function () {
    // Time is already fast-forwarded -- hardhat can't reset time between it()s
    await this.vjwt.commitJWTProof(...this.addr1Commits)
    await expect(
        this.vjwt.connect(this.addr1).verifyMe(...this.pv2.verifyMeContractParams())
    ).to.be.revertedWith(vmExceptionStr + "'JWT is expired'")
  });
});