const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const { searchForPlainTextInBase64 } = require('wtfprotocol-helpers');


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
  jwksKeyToPubkey
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

describe('slicing of byte array', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.vjwt = await deployVerifyJWTContract(11,59, kidOrcid, orcidBottomBread, orcidTopBread)
  });

  it('slicing raw bytes gives correct result', async function () {
    expect(await this.vjwt.sliceBytesMemory([5, 6, 1, 3], 1,2)).to.equal('0x06');
    expect(await this.vjwt.sliceBytesMemory([5, 6, 1, 3], 0,3)).to.equal('0x050601'); 
    expect(await this.vjwt.sliceBytesMemory([5, 6, 1, 3], 1,4)).to.equal('0x060103'); 
    expect(await this.vjwt.sliceBytesMemory([5, 6, 1, 3], 0,4)).to.equal('0x05060103'); 
  });

  it('slicing hex string gives correct result', async function () {
    expect(await this.vjwt.sliceBytesMemory('0x05060103', 1,2)).to.equal('0x06');
    expect(await this.vjwt.sliceBytesMemory('0x05060103', 0,3)).to.equal('0x050601'); 
    expect(await this.vjwt.sliceBytesMemory('0x05060103', 1,4)).to.equal('0x060103'); 
    expect(await this.vjwt.sliceBytesMemory('0x05060103', 0,4)).to.equal('0x05060103'); 
  });

  it('slicing actual JWT gives correct result', async function () {
    expect(await this.vjwt.sliceBytesMemory('0x7b226b6964223a2270726f64756374696f6e2d6f726369642d6f72672d3768646d64737761726f736733676a756a6f3861677774617a676b70316f6a73222c22616c67223a225253323536227d007b2261745f68617368223a225f54424f654f67655937304f5670474563434e2d3351222c22617564223a224150502d4d504c4930465152555646454b4d5958222c22737562223a22303030302d303030322d323330382d39353137222c22617574685f74696d65223a313634343833303139312c22697373223a2268747470733a5c2f5c2f6f726369642e6f7267222c22657870223a313634343931383533372c22676976656e5f6e616d65223a224e616e616b204e6968616c222c22696174223a313634343833323133372c2266616d696c795f6e616d65223a224b68616c7361222c226a7469223a2237313364633066622d333065302d343334322d393831632d336562326231346238333438227d', 143, 171)).to.equal('0x22737562223a22303030302d303030322d323330382d39353137222c');
  });
});

describe('handleKeyRotation', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.initialExponent = 9
    this.initialModulus = 37
    this.initialKid = 'someKeyId'
    this.vjwt = await deployVerifyJWTContract(this.initialExponent, this.initialModulus, this.initialKid, orcidBottomBread, orcidTopBread)
  });

  it('Should update kid, e, and n', async function () {
    expect(await this.vjwt.callStatic.kid()).to.equal(this.initialKid)
    expect(await this.vjwt.callStatic.e()).to.equal(this.initialExponent)
    expect(parseInt(await this.vjwt.callStatic.n(), 16)).to.equal(this.initialModulus)

    const newE = 11;
    const newM = 59;
    await this.vjwt.handleKeyRotation(newE, newM, kidOrcid)
    expect(await this.vjwt.callStatic.kid()).to.equal(kidOrcid)
    expect(await this.vjwt.callStatic.e()).to.equal(newE)
    expect(parseInt(await this.vjwt.callStatic.n(), 16)).to.equal(newM)
  });
});

describe('type conversion and cryptography', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.vjwt = await deployVerifyJWTContract(11,59, kidOrcid, orcidBottomBread, orcidTopBread)
    this.message = 'Hey'
  });

  it('sha256 hashing gives the same result on chain and frontend', async function () {
    const publicHashedMessage = keccak256FromString(this.message)
    const secretHashedMessage = sha256FromString(this.message)  
    expect(await this.vjwt.testSHA256OnJWT(this.message)).to.equal(secretHashedMessage)
  });
});

describe('modExp works', function () {
  it('Test modExp on some simple numbers', async function () {
    const [owner] = await ethers.getSigners();
    let vjwt = await deployVerifyJWTContract(58,230, kidOrcid, orcidBottomBread, orcidTopBread)
    await expect(vjwt.modExp(0x004b,1,8001)).to.emit(vjwt, 'modExpEventForTesting').withArgs('0x004b');
    await expect(vjwt.modExp(5,5,5)).to.emit(vjwt, 'modExpEventForTesting').withArgs('0x00');
    await expect(vjwt.modExp(0,1,6)).to.emit(vjwt, 'modExpEventForTesting').withArgs('0x00');
    await expect(vjwt.modExp(5,2,23)).to.emit(vjwt, 'modExpEventForTesting').withArgs('0x02');
  });
});

describe('Verify test RSA signatures', function () {
  it('Verify with a real JWT', async function () {
    const orig = 'access_token=117a16aa-f766-4079-ba50-faaf0a09c864&token_type=bearer&expires_in=599&tokenVersion=1&persistent=true&id_token=eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A&tokenId=254337461'
    let parsedToJSON = {}
    orig.split('&').map(x=>{let [key, value] = x.split('='); parsedToJSON[key] = value});
    let [headerRaw, payloadRaw, signatureRaw] = parsedToJSON['id_token'].split('.');
    let [signature, badSignature] = [Buffer.from(signatureRaw, 'base64url'), Buffer.from(signatureRaw.replace('a','b'), 'base64url')]

    let vjwt = await deployVerifyJWTContract(eOrcid, nOrcid, kidOrcid, orcidBottomBread, orcidTopBread);

    await expect(vjwt['verifyJWT(bytes,string)'](ethers.BigNumber.from(signature), headerRaw + '.' + payloadRaw)).to.emit(vjwt, 'JWTVerification').withArgs(true);
    // make sure it doesn't work with wrong JWT or signature:
    await expect(vjwt['verifyJWT(bytes,string)'](ethers.BigNumber.from(signature), headerRaw + ' : )' + payloadRaw)).to.emit(vjwt, 'JWTVerification').withArgs(false);
    await expect(vjwt['verifyJWT(bytes,string)'](ethers.BigNumber.from(badSignature), headerRaw + '.' + payloadRaw)).to.emit(vjwt, 'JWTVerification').withArgs(false);

  });
})

describe('proof of prior knowledge', function () {
  beforeEach(async function(){
    [this.owner, this.addr1] = await ethers.getSigners();
    this.vjwt = await deployVerifyJWTContract(11,230, kidOrcid, orcidBottomBread, orcidTopBread)
    this.message1 = 'Hey'
    this.message2 = 'Hey2'
    // Must use two unique hashing algorithms
    //  If not, hash(JWT) would be known, so then XOR(public key, hash(JWT)) can be replaced with XOR(frontrunner pubkey, hash(JWT)) by a frontrunner
    // this.publicHashedMessage1 = keccak256FromString(this.message1)
    // this.secretHashedMessage1 = sha256FromString(this.message1)
    
    // this.publicHashedMessage2 = keccak256FromString(this.message2)
    // this.secretHashedMessage2 = sha256FromString(this.message2)

    let hashedMessage1 = sha256FromString(this.message1)
    let hashedMessage2 = sha256FromString(this.message1)

    this.proof1 = ethers.utils.sha256(await xor(Buffer.from(hashedMessage1.replace('0x', ''), 'hex'),
                                                Buffer.from(this.owner.address.replace('0x', ''), 'hex')))
    this.proof2 = ethers.utils.sha256(await xor(Buffer.from(hashedMessage2.replace('0x', ''), 'hex'),
                                                Buffer.from(this.owner.address.replace('0x', ''), 'hex')))    
    
    
  })
  it('Can prove prior knowledge of message (not JWT but can be)', async function () {
    await this.vjwt.commitJWTProof(this.proof1)
    await ethers.provider.send('evm_mine')
    expect(await this.vjwt['checkJWTProof(address,string)'](this.owner.address, this.message1)).to.equal(true)
  });

  it('Cannot prove prior knowledge of message (not JWT but can be) in one block', async function () {
    await this.vjwt.commitJWTProof(this.proof1)
    await expect(this.vjwt['checkJWTProof(address,string)'](this.owner.address, this.message1)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun'");
  });

  it('Cannot prove prior knowledge of different message (not JWT but can be)', async function () {
    await this.vjwt.commitJWTProof(this.proof1)
    await ethers.provider.send('evm_mine')
    await expect(this.vjwt['checkJWTProof(address,string)'](this.owner.address, this.message2)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Proof not found; it needs to have been submitted to commitJWTProof in a previous block'");
  });

  // This is not a great attack vector but good to check that it's impossible 
  it('Cannot prove prior knowledge of using different public key', async function () {
    await this.vjwt.commitJWTProof(this.proof1)
    await ethers.provider.send('evm_mine')
    await expect(this.vjwt['checkJWTProof(address,string)']('0x483293fCB4C2EE29A02D74Ff98C976f9d85b1AAd', this.message1)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Proof not found; it needs to have been submitted to commitJWTProof in a previous block'");
  });
});

describe('Frontend sandwiching', function(){
  it('Test that correct sandwich is given for a specific ID', async function(){
    let vjwt = await deployVerifyJWTContract(50,100, kidOrcid, orcidBottomBread, orcidTopBread);
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
    id : '0000-0002-2308-9517',
    expTime : '1651375833',
    createContract : upgradeMode ?
                       async() => await upgradeVerifyJWTContract('orcid')
                       :
                       async() => await deployVerifyJWTContract(orcidParams.e, orcidParams.n, orcidParams.kid, orcidParams.idBottomBread, orcidParams.idTopBread, orcidParams.expBottomBread, orcidParams.expTopBread)
                       
  },
  // {
  //   name : 'google',
  //   idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjcyOTE4OTQ1MGQ0OTAyODU3MDQyNTI2NmYwM2U3MzdmNDVhZjI5MzIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiMDREZXRTaGNSYUE4OWxlcEQzdWRnUSIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjQ3NjYzNDk4LCJleHAiOjE2NDc2NjcwOTgsImp0aSI6IjE4ZmRmMGQ2M2VhYjI4YjRlYmY0NmFiMDMzZTM5OTU3NmE5MTJlZGUifQ.YqmOub03zNmloAcFvZE0E-4Gt2Y5fr_9XQLUYqXQ24X_GJaJh0HSQXouJeSXjnk8PT6E1FnPd89QAgwDvE_qxAoOvW7VKDycVapOeDtKdTQ-QpAn-ExE0Pvqgx1iaGRZFDS4DWESX1ZsQIBAB_MHK_ZFdAnOjeFzImuMkB1PZLY99przSaM8AEyvWn8wfEgdmkdoJERBXF7xJI2dfA9mTRjlQvhSC4K060bTJbUYug4sQLrvo53CsDjvXRnodnCB81EVWZUbf5B9dG__kebI3AjedKUcPb2wofpX_B7uAyVlD7Au3APEbZP7Asle0Bi76hDNGPQbLvR_nGWLoySfCQ',
  //   id : 'nanaknihal@gmail.com',
  //   expTime : '1647667098',
  //   createContract : upgradeMode ?
  //                      async() => await upgradeVerifyJWTContract('google')
  //                      :
  //                      async() => await deployVerifyJWTContract(eGoogle, nGoogle, kidGoogle, googleBottomBread, googleTopBread)
  // },
  // {
  //   name : 'twitter',
  //   idToken: 'eyJraWQiOiJvYWdZIn0.eyJjcmVkcyI6IlByb3RvY29sV3RmIiwiYXVkIjoiZ25vc2lzIiwicmFuZCI6IjVQNnc1S1FJWVdsalRPNG5rY2pLWDQ4Rld5eWk3UjBwakZ2d29wUmJVVVEifQ.DCaq7MhsFpTDim0hevcGLr9TZKGCpnu2bBJe3lRO1oFhFnGHbgW2IyKpnKyyDQUllyN5LEPOt_vDH7PHdUiyw1tNapzYTh0-e4DAhq8rzlPQ6BHRW_iko9Fa1JbrqTA_M2uFBku0EHfaH730OAJdZvmhnnNSxruvmLPZeZ6SJWUaPj2wIRoxCrLCt888GF3vQacBf2_2RZFWbWdTKYyXyKI6f224PIJo6C5sQu48_po-x4r8M4MpIUBIbN5i-qukn70rfJQ-ZQPnErnUlLoMkRIJK5u3tXegBqUEmQhcxYE25MXcS3FNf9JktkZ1fDr9X1JwyRLT2oe0gl53jtDL8w==',
  //   id : 'ProtocolWtf',
  //   createContract : upgradeMode ?
  //                      async() => await upgradeVerifyJWTContract('twitter')
  //                      :
  //                      async() => await deployVerifyJWTContract(eTwitter, nTwitter, kidTwitter, twitterBottomBread, twitterTopBread)
  // },
  // {
  //   name : 'github',
  //   idToken: 'eyJraWQiOiJxN3dXIn0.eyJjcmVkcyI6Im5hbmFrbmloYWwiLCJhdWQiOiJnbm9zaXMiLCJyYW5kIjoiOE9YMzhaa1NCaTd5MmpKeW1MNm8zaklJSmN4bmJkSnJBTVR3ME9QYXNnNCJ9.Cuzsl3fOsk0ZypPAzgnWl5xQ0jm0kDVFWu4jL7hRbe0ptaSw4eVL5dLRHJtOVTusJHVz7GF0zrAkyTFFk4T8iQ4Wcl66YyKGuMo_BMCM0O7oy4wBMQ9Ur23zPAxG2FF0iaMnh8HHqooilq5HdmTN9WWvUyqBsvrr3MOeQz7OSZj3206eSmC9BR4NDBhzT-12DPt8fG0be_621xDhFv9_EcOUhEfht-qz-mJtRcKCnJRKnDWPVdaQey_yOZSxiWZMZa34TrGuhPLxCd7TRJEGgRJi7eTQ2roZkT-z3gZdCnK0qNdJIWwagVwPc0_ILIKloI3bQjp67f8LSiFoJu_N0Q==',
  //   id : 'nanaknihal',
  //   createContract : upgradeMode ?
  //                      async() => await upgradeVerifyJWTContract('github')
  //                      :
  //                      async() => await deployVerifyJWTContract(eGithub, nGithub, kidGithub, githubBottomBread, githubTopBread)
  // }
]){

  describe.only('Integration tests for after successful proof commit with params ' + params.name, function () {
    beforeEach(async function(){
      [this.owner, this.addr1] = await ethers.getSigners()
  
      let [headerRaw, payloadRaw, signatureRaw] = params.newToken.split('.');
      // let [header, payload] = [headerRaw, payloadRaw].map(x => JSON.parse(atob(x)));
      // let payload = atob(payloadRaw);
      this.signature = Buffer.from(signatureRaw, 'base64url')
      this.vjwt = await params.createContract();
      await this.vjwt.changeSandwich(params.idBottomBread, params.idTopBread, params.expBottomBread, params.expTopBread)
      this.message = headerRaw + '.' + payloadRaw
      
      this.payloadIdx = Buffer.from(headerRaw).length + 1 //Buffer.from('.').length == 1

      // Find ID and exp sandwiches (and make a bad one for testing purposes to make sure it fails)
      let idSandwichValue = await sandwichDataWithBreadFromContract(params.id, this.vjwt, type='id');
      let wrongIDSandwichValue = await sandwichDataWithBreadFromContract('0200-0002-2308-9517', this.vjwt, type='id');
      let expSandwichValue = await sandwichDataWithBreadFromContract(params.expTime, this.vjwt, type='exp');

      // find indices of sandwich in raw payload:
      let [startIdxID, endIdxID] = searchForPlainTextInBase64(Buffer.from(idSandwichValue, 'hex').toString(), payloadRaw)
      let [startIdxExp, endIdxExp] = searchForPlainTextInBase64(Buffer.from(expSandwichValue, 'hex').toString(), payloadRaw)

      this.proposedIDSandwich = {idxStart: startIdxID, idxEnd: endIdxID, sandwichValue: Buffer.from(idSandwichValue, 'hex')} 
      this.wrongProposedIDSandwich = {idxStart: startIdxID, idxEnd: endIdxID, sandwichValue: Buffer.from(wrongIDSandwichValue, 'hex')}   
      this.proposedExpSandwich = {idxStart: startIdxExp, idxEnd: endIdxExp, sandwichValue: Buffer.from(expSandwichValue, 'hex')} 

      // this.startIdxID = startIdxID; this.endIdxID = endIdxID
      // let publicHashedMessage = keccak256FromString(this.message)
      // let secretHashedMessage = sha256FromString(this.message)
      let hashedMessage = sha256FromString(this.message)
      let proof = ethers.utils.sha256(await xor(Buffer.from(hashedMessage.replace('0x', ''), 'hex'), 
                                                Buffer.from(this.owner.address.replace('0x', ''), 'hex')))


      await this.vjwt.commitJWTProof(proof)
      await ethers.provider.send('evm_mine')
    });

    // NOTE should be unit test
    // it('Expired JWT does not work', async function () {
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.proposedIDSandwich, this.proposedExpSandwich)).to.be.revertedWith('JWT is expired');
    //   await ethers.provider.send('evm_setNextBlockTimestamp', [parseInt(params.expTime) - 1000])
    //   await ethers.provider.send('evm_mine')
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.proposedIDSandwich, this.proposedExpSandwich)).to.emit(this.vjwt, 'JWTVerification').withArgs(true);
    // });

    it('JWT works once but cannot be used twice (and emits JWTVerification event, which does NOT mean everything was successful -- it is just a testing event)', async function () {
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.proposedIDSandwich, this.proposedExpSandwich)).to.not.be.reverted
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.proposedIDSandwich, this.proposedExpSandwich)).to.be.revertedWith('JWT can only be used on-chain once')
    });
    /* UNCOMMENT ALL TESTS BELOW
    // it('JWT emits KeyAuthorization event, another testing event which does NOT mean everything was successsful -- just that some intermediary stages were successful', async function () {
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.emit(this.vjwt, 'KeyAuthorization').withArgs(true); 
    //   });
  
    // it('Wrong message fails', async function () {
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message.replace('a', 'b'), this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('Verification of JWT failed');
    // });
  
    // it('Wrong indices fail (this could be more comprehensive and more unit-like)', async function () {
    //   // Have to use Math.max(i, 0) for the first one to ensure index isn't negative if header doesn't exist!
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx - 1, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx + 1, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx + 1, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   if(this.startIdx > 0){
    //     await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx - 1, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   }
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx + 1, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx - 1, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    // });
  
    // it('Wrong sandwich fails', async function () {
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich+'e6')).to.be.revertedWith('Failed to find correct top bread in sandwich');
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0xb5'+this.sandwich)).to.be.revertedWith('Failed to find correct bottom bread in sandwich');
    //   await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.wrongSandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    // });
  
    // it('Creds lookup works', async function () {
    //   let registeredAddresses, registeredCreds;
  
    //   [registeredAddresses, registeredCreds] = [await this.vjwt.getRegisteredAddresses(), await this.vjwt.getRegisteredCreds()];
    //   expect(registeredAddresses.length).to.equal(0);
    //   expect(registeredCreds.length).to.equal(0);
    //   expect(await this.vjwt.addressForCreds(Buffer.from('0000-0002-2308-9517'))).to.equal(ethers.constants.AddressZero);
  
    //   await this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich);
      
    //   [registeredAddresses, registeredCreds] = [await this.vjwt.getRegisteredAddresses(), await this.vjwt.getRegisteredCreds()];
    //   expect(registeredAddresses.length).to.equal(1);
    //   expect(registeredCreds.length).to.equal(1);
    //   expect(await this.vjwt.addressForCreds(Buffer.from(params.id))).to.equal(this.owner.address);
      
    //   expect(registeredAddresses[0] === this.owner.address).to.equal(true);
    // });
     UNCOMMENT ALL TESTS ABOVE */
    
      // TODO: add tests for address => creds,  address => JWT,  JWT => address
  
  
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
//     this.vjwt = await deployVerifyJWTContract(eOrcid, nOrcid, kidOrcid, orcidBottomBread, orcidTopBread);
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
//     console.log('proof is ', await xor(hashedMessage, this.owner.address), proof)
//     await this.vjwt.commitJWTProof(proof)
//     await ethers.provider.send('evm_mine')
//   });
//   it('jfakjfak', async function (){
//     console.log('still need to implement this')
//   })
// });
