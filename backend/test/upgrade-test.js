// Forks current VJWT contract(s) onto local hardhat network, upgrades them, and runs existing tests on them
const { expect } = require('chai');
const { network, ethers, upgrades } = require('hardhat');
const wtf = require('wtf-lib');
const {
    googleParams,
    upgradeVerifyJWTContract,
    getParamsForVerifying,
    // orcidParams,
    // twitterParams,
    // githubParams,
    // deployVerifyJWTContract,
    // sha256FromString,
    // keccak256FromString,
    // sandwichDataWithBreadFromContract,
    // jwksKeyToPubkey,
    // vmExceptionStr,
  } = require('./utils/utils');


describe.only('upgrade-specific tests from v1 to v3', function(){
    before(async function(){
        this.contract = await upgradeVerifyJWTContract('google')
        await this.contract.changeSandwich(googleParams.idBottomBread, googleParams.idTopBread, googleParams.expBottomBread, googleParams.expTopBread)

    });
    it('Test with Twitter, facebook, etc.', function(){
        expect(false).to.equal('NOT IMPLEMENTED YET')
    });

    
    it('New address is correct', async function(){
        expect(this.contract.address).to.equal(wtf.getContractAddresses().VerifyJWT.gnosis.google)
        expect(this.contract.address).to.not.equal('abc')
    });


    describe('Old functions with old data work', function(){
        before(async function(){
            this.contract = await upgradeVerifyJWTContract('google')
        });

        it('Lookup by old credential system still works', async function (){
            const email = Buffer.from('shady@opscientia.com')
            const address = '0xD638F5c8D434EBf6Ba3a2527bA76B08813b4598e'
            expect(await this.contract.addressForCreds(email)).to.equal(address)
            expect(await this.contract.credsForAddress(address)).to.equal('0x'+email.toString('hex'))
        });
        it('Existing user can register new credentials', async function (){
            const [owner, addr1] = await ethers.getSigners();
            const [oldCreds, newCreds] = [
                                            '0x' + Buffer.from('wtfprotocol@gmail.com').toString('hex'),
                                            '0x' + Buffer.from('nanaknihal@gmail.com').toString('hex')
                                        ]
            
            // Check that it's currently old creds
            expect(await this.contract.credsForAddress(owner.address)).to.equal(oldCreds)

            const jwt = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg2MTY0OWU0NTAzMTUzODNmNmI5ZDUxMGI3Y2Q0ZTkyMjZjM2NkODgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoidDZqVl9BZ0FyTGpuLXFVSlN5bUxoZyIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjUxMzQ5MjczLCJleHAiOjE2NTEzNTI4NzMsImp0aSI6IjA3NTU4ODdlOTI3MzA1ZTY0Y2E4MWVhMzE3YjYxZGQxYWJjNWFiZjgifQ.PXrelpQdJkTxbQw66p6HaSGT5pR6qhkZ8-04hLnVhmrzOJLBkyYisWHzP1t96IWguswMZ4tafg2uCCnra2zkz6BMiBCPrGJdk0l_Kx06FJMX-QNVdt5hW28qM6il94eb0g_OTHCmI28eUJf1rNY8D5NMrG3kXWPDQ8_EkOyySVbu6ED1XFbYgHzo560Ty1-gkQRQKYCuogqrcDBRPF3tqXyg9itCHawm6Kll_GX1TP5zwnwtr5WVrAFYtLJV1_VAEfKWkdU6v6LkAgq4ZjzunFRWBclLVCS2X1JO8iBeGjl_LVVoycvxwojrlZigplQAUSsxmDjlQ4VLH9vINiid6Q'
            const params = await getParamsForVerifying(this.contract, jwt, 'email');
            const commitments = params.generateCommitments(owner.address);
            console.error(commitments)
            await this.contract.commitJWTProof(...commitments);
            await ethers.provider.send('evm_mine');
            await this.contract.verifyMe(ethers.BigNumber.from(params.signature), params.message, params.payloadIdx, params.proposedIDSandwich, params.proposedExpSandwich)                            
            
            // Check that it's now new creds 
            expect(await this.contract.credsForAddress(owner.address)).to.equal(newCreds)
        });
        
    });
    
    describe('New functions with old data work', function(){
        before(async function(){
            // Upgrade the contract
        });
        it('New abc test function works', async function (){
            // expect(await this.contract.abc()).to.equal('def')
            // await this.contract.testTimeAssumptions()
        });  
    });
})


