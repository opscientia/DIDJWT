const { expect } = require('chai');
const { ethers } = require('hardhat');
const { getContractAddress } = require('@ethersproject/address')
const { solidity } = require("ethereum-waffle");
const search64 = require('../../../whoisthis.wtf-frontend/src/searchForPlaintextInBase64.js');
// import { fixedBufferXOR as xor, sandwichIDWithBreadFromContract, padBase64, hexToString, searchForPlainTextInBase64 } from 'wtfprotocol-helpers';
const { hexToString, fixedBufferXOR } = require('wtfprotocol-helpers');
const xor = fixedBufferXOR;

const {
  vmExceptionStr,
  orcidParams, googleParams,
  deployVerifyJWTContract,
  deployIdAggregator,
  deployWTFBios,
  getParamsForVerifying,
  sha256FromString,
  sandwichDataWithBreadFromContract,
  jwksKeyToPubkey,
} = require('./utils/utils');


describe('IdentityAggregator', function () {

  describe("keywords", function () {
    before(async function () {
      this.idAggregator = await deployIdAggregator();
    });

    it("Should be empty when contract is deployed", async function () {
      expect(await this.idAggregator.getKeywords()).to.be.an('array').that.is.empty;
    });
    
    it("Should include 'orcid' after support for orcid contract is added", async function () {
      const keyword = 'orcid';
      await this.idAggregator.addVerifyJWTContract(keyword, "0x100DEF1234567890ABCDEF1234567890ABCDE001");
      expect(await this.idAggregator.getKeywords()).to.include(keyword);
    });
    
    it("Should include 'google' after support for google contract is added", async function () {
      const keyword = 'google';
      await this.idAggregator.addVerifyJWTContract(keyword, "0x200DEF1234567890ABCDEF1234567890ABCDE002");
      expect(await this.idAggregator.getKeywords()).to.include(keyword);
    });

    it("Should include both 'orcid' and 'google'", async function () {
      const keywords = ['orcid', 'google'];
      expect(await this.idAggregator.getKeywords()).to.have.members(keywords);
    });

    // Test deletion
    it("Should not include 'orcid' after support for orcid contract is removed", async function () {
      const keyword = 'orcid';
      await this.idAggregator.removeSupportFor(keyword);
      expect(await this.idAggregator.getKeywords()).to.not.include(keyword);
    });

    it("Should not include 'google' after support for google contract is removed", async function () {
      const keyword = 'google';
      await this.idAggregator.removeSupportFor(keyword);
      expect(await this.idAggregator.getKeywords()).to.not.include(keyword);
    });

    // Test addition after deletion
    it("Should include 'twitter' after support for twitter contract is added", async function () {
      const keyword = 'twitter';
      await this.idAggregator.addVerifyJWTContract(keyword, "0x300DEF1234567890ABCDEF1234567890ABCDE003");
      expect(await this.idAggregator.getKeywords()).to.include(keyword);
    });

  });

  describe("biosContract", function () {
    before(async function () {
      this.idAggregator = await deployIdAggregator();
    });

    it("Should be all zeros when contract is deployed", async function () {
      expect(await this.idAggregator.getBiosContractAddress()).to.equal('0x0000000000000000000000000000000000000000');
    });
    
    it("Should be updated when setBiosContractAddress is called", async function () {
      await this.idAggregator.setBiosContractAddress("0x100def1234567890AbCdEf1234567890abCde001");
      expect(await this.idAggregator.getBiosContractAddress()).to.equal('0x100def1234567890AbCdEf1234567890abCde001');
    });
  });

  describe("contractAddrForKeyword", function () {
    it("Should be updated when support for a new contract is added", async function () {
      const idAggregator = await deployIdAggregator();
      const [owner] = await ethers.getSigners();

      vjwt = await deployVerifyJWTContract(11, 59, 'abc', orcidParams.idBottomBread, orcidParams.idTopBread, orcidParams.expBottomBread, orcidParams.expTopBread);

      const keyword = "orcid";
      await idAggregator.addVerifyJWTContract(keyword, vjwt.address);

      const verifyJWTAddress = await idAggregator.callStatic.contractAddrForKeyword(keyword);
      expect(verifyJWTAddress).to.equal(vjwt.address);
    });
  });

  describe("addVerifyJWTContract", function () {
    before(async function () {
      this.idAggregator = await deployIdAggregator();
    });

    it("Should revert when attempting to use the keyword of an already supported contract", async function () {
      const keyword = 'twitter';
      addr = '0x100DEF1234567890ABCDEF1234567890ABCDE001';
      await this.idAggregator.addVerifyJWTContract(keyword, addr);
      addr = '0x200DEF1234567890ABCDEF1234567890ABCDE002';
      const funcStr = 'addVerifyJWTContract(string,address)';
      await expect(this.idAggregator[funcStr](keyword, addr)).to.be.revertedWith(vmExceptionStr + "'This keyword is already being used'");
    });
  });

  describe('removeSupportFor', async function () {
    // Try to remove an unsupported contract
    it('Should revert ', async function () {
      const idAggregator = await deployIdAggregator()
      keyword = 'twitter';
      await idAggregator.addVerifyJWTContract(keyword, "0x100DEF1234567890ABCDEF1234567890ABCDE001");
      expect(await idAggregator.getKeywords()).to.include(keyword);

      keyword = "definitelynotthekeyword";
      const funcStr = 'removeSupportFor(string)';
      await expect(idAggregator[funcStr](keyword)).to.be.revertedWith(vmExceptionStr + "'There is no corresponding contract for this keyword'");
    });
  });

  describe.only('getAllAccounts', function () {
    before(async function () {
      this.idAggregator = await deployIdAggregator();

      const [owner] = await ethers.getSigners();
      [this.name, this.bio] = ['name', 'Business person']
      this.wtfBios = await deployWTFBios();
      await this.wtfBios.connect(owner).setNameAndBio(this.name, this.bio);
      await this.idAggregator.setBiosContractAddress(this.wtfBios.address);
    });

    it("Should return array of supported creds, the first of which is the correct orcid", async function() {
      //--------------------------- Set up context to call commitJWTProof() and verifyMe()---------------------------
      const [owner] = await ethers.getSigners();
      const vjwt = await deployVerifyJWTContract(...orcidParams.getDeploymentParams());
      const idToken = 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoibG9lOGFqMjFpTXEzMVFnV1NEOXJxZyIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY1MTI3NzIxOCwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY1MTM3NTgzMywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjUxMjg5NDMzLCJub25jZSI6IndoYXRldmVyIiwiZmFtaWx5X25hbWUiOiJLaGFsc2EiLCJqdGkiOiI1YmEwYTkxNC1kNWYxLTQ2NzUtOGI5MS1lMjkwZjc0OTI3ZDQifQ.Q8B5cmh_VpaZaQ-gHIIAtmh1RlOHmmxbCanVIxbkNU-FJk8SH7JxsWzyhj1q5S2sYWfiee3eT6tZJdnSPInGYdN4gcjCApJAk2eZasm4VHeiPCBHeMyjNQ0w_TZJFhY0BOe7rES23pwdrueEqMp0O5qqFV0F0VTJswyy-XMuaXwoSB9pkHFBDS9OUDAiNnwYakaE_lpVbrUHzclak_P7NRxZgKlCl-eY_q7y0F2uCfT2_WY9_TV2BrN960c9zAMQ7IGPbWNwnvx1jsuLFYnUSgLK1x_TkHOD2fS9dIwCboB-pNn8B7OSI5oW7A-aIXYJ07wjHMiKYyBu_RwSnxniFw';
      const pv = await getParamsForVerifying(vjwt, idToken, 'sub')

      await vjwt.commitJWTProof(...pv.generateCommitments(owner.address));
      await ethers.provider.send('evm_mine');

      await vjwt.verifyMe(...pv.verifyMeContractParams());

      const keyword = "orcid";
      await this.idAggregator.addVerifyJWTContract(keyword, vjwt.address);

      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const creds = hexToString(allAccounts['creds'][0]);


      //--------------------------- Run test ---------------------------

      expect(creds).to.equal(pv.id);
    });

    it("Should return array of supported creds, the second of which is the correct gmail", async function() {
      //--------------------------- Set up context to call commitJWTProof() and verifyMe()---------------------------
      const [owner] = await ethers.getSigners();
      const vjwt = await deployVerifyJWTContract(...googleParams.getDeploymentParams());
      const idToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg2MTY0OWU0NTAzMTUzODNmNmI5ZDUxMGI3Y2Q0ZTkyMjZjM2NkODgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoidDZqVl9BZ0FyTGpuLXFVSlN5bUxoZyIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjUxMzQ5MjczLCJleHAiOjE2NTEzNTI4NzMsImp0aSI6IjA3NTU4ODdlOTI3MzA1ZTY0Y2E4MWVhMzE3YjYxZGQxYWJjNWFiZjgifQ.PXrelpQdJkTxbQw66p6HaSGT5pR6qhkZ8-04hLnVhmrzOJLBkyYisWHzP1t96IWguswMZ4tafg2uCCnra2zkz6BMiBCPrGJdk0l_Kx06FJMX-QNVdt5hW28qM6il94eb0g_OTHCmI28eUJf1rNY8D5NMrG3kXWPDQ8_EkOyySVbu6ED1XFbYgHzo560Ty1-gkQRQKYCuogqrcDBRPF3tqXyg9itCHawm6Kll_GX1TP5zwnwtr5WVrAFYtLJV1_VAEfKWkdU6v6LkAgq4ZjzunFRWBclLVCS2X1JO8iBeGjl_LVVoycvxwojrlZigplQAUSsxmDjlQ4VLH9vINiid6Q'
      const pv = await getParamsForVerifying(vjwt, idToken, 'email')
      await vjwt.commitJWTProof(...pv.generateCommitments(owner.address));
      await ethers.provider.send('evm_mine');
      await vjwt.verifyMe(...pv.verifyMeContractParams());
      const keyword = "google";
      await this.idAggregator.addVerifyJWTContract(keyword, vjwt.address);

      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const creds = hexToString(allAccounts['creds'][1]);

      //--------------------------- Run test ---------------------------

      expect(creds).to.equal(pv.id);
    });

    it("Should return the correct array of supported creds", async function() {
      const [owner] = await ethers.getSigners();
      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const credsArray = allAccounts['creds'].map(creds => hexToString(creds));

      expect(credsArray).to.include.members(['nanaknihal@gmail.com', '0000-0002-2308-9517']);
    });

    it("Should return an array that includes gmail but not orcid", async function() {
      await this.idAggregator.removeSupportFor('orcid');
      const [owner] = await ethers.getSigners();
      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const credsArray = allAccounts['creds'].map(creds => hexToString(creds));

      expect(credsArray).to.not.include.members(['0000-0002-2308-9517']);
    });

    it("Should return an array that includes neither orcid nor gmail", async function() {
      await this.idAggregator.removeSupportFor('google');
      const [owner] = await ethers.getSigners();
      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const credsArray = allAccounts['creds'].map(creds => hexToString(creds));

      expect(credsArray).to.not.include.members(['nanaknihal@gmail.com', '0000-0002-2308-9517']);
    });
  });

});
