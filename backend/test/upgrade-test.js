// Forks current VJWT contract(s) onto local hardhat network, upgrades them, and runs existing tests on them
const { expect } = require('chai');
const { network, ethers, upgrades } = require('hardhat');
const wtf = require('wtf-lib');
const {
    orcidParams,
    googleParams,
    twitterParams,
    githubParams,
    upgradeVerifyJWTContract,
    getParamsForVerifying,
    // deployVerifyJWTContract,
    // sha256FromString,
    // keccak256FromString,
    // sandwichDataWithBreadFromContract,
    // jwksKeyToPubkey,
    // vmExceptionStr,
  } = require('./utils/utils');

for (const service of [{
    name: 'google', 
    params: googleParams, 
    idFieldName: 'email',
    lookupTest: {creds: 'shady@opscientia.com', address: '0xD638F5c8D434EBf6Ba3a2527bA76B08813b4598e'},
    // Change my email from wtfprotocol@gmail.com to nanaknihal@gmail. This is just changing the contract owner's address, because it's convenient -- perhaps it would be more rigorous to also test for other addresses, although I highly doubt this will ever be an onlyOwner function, and if so, NBD
    updateTest: {oldCreds: 'wtfprotocol@gmail.com', newCreds: 'nanaknihal@gmail.com', newToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg2MTY0OWU0NTAzMTUzODNmNmI5ZDUxMGI3Y2Q0ZTkyMjZjM2NkODgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoidDZqVl9BZ0FyTGpuLXFVSlN5bUxoZyIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjUxMzQ5MjczLCJleHAiOjE2NTEzNTI4NzMsImp0aSI6IjA3NTU4ODdlOTI3MzA1ZTY0Y2E4MWVhMzE3YjYxZGQxYWJjNWFiZjgifQ.PXrelpQdJkTxbQw66p6HaSGT5pR6qhkZ8-04hLnVhmrzOJLBkyYisWHzP1t96IWguswMZ4tafg2uCCnra2zkz6BMiBCPrGJdk0l_Kx06FJMX-QNVdt5hW28qM6il94eb0g_OTHCmI28eUJf1rNY8D5NMrG3kXWPDQ8_EkOyySVbu6ED1XFbYgHzo560Ty1-gkQRQKYCuogqrcDBRPF3tqXyg9itCHawm6Kll_GX1TP5zwnwtr5WVrAFYtLJV1_VAEfKWkdU6v6LkAgq4ZjzunFRWBclLVCS2X1JO8iBeGjl_LVVoycvxwojrlZigplQAUSsxmDjlQ4VLH9vINiid6Q'} 
},
{
    name: 'orcid', 
    params: orcidParams, 
    idFieldName: 'sub',
    lookupTest: {creds: '0000-0002-2318-4477', address: '0xD638F5c8D434EBf6Ba3a2527bA76B08813b4598e'},
    // Change my ORCID to Shady's (by using his JWT). This is just changing the contract owner's address, because it's convenient -- perhaps it would be more rigorous to also test for other addresses, although I highly doubt this will ever be an onlyOwner function, and if so, NBD
    updateTest: {oldCreds: '0000-0002-2308-9517', newCreds: '0000-0002-2318-4477', newToken: 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiXzRCMzFzeTJpQWM0ajVvcXEwQ2JVUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMTgtNDQ3NyIsImF1dGhfdGltZSI6MTY1MTI4MTE4NCwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY1MTM2NzcwNCwiZ2l2ZW5fbmFtZSI6IlNoYWR5IiwiaWF0IjoxNjUxMjgxMzA0LCJub25jZSI6IndoYXRldmVyIiwiZmFtaWx5X25hbWUiOiJFbCBEYW1hdHkiLCJqdGkiOiI0ZDFjOTA1YS04Y2UyLTQ3ODEtYTYyYy02YzRlOGE5MzljZDQifQ.Lg2Nd95rrNORAJUjb94YJlbf1bi-Sko2Lwlk4zBcGeCnn0hEJPn38GmvQ7qIu0veY3drKbOrlhPn76icBcafa9Yk-GVc80QIfhYPL-aK7FsVBpkPQT6k1pLPnX-pHFBKquIbmKYdcO-PYRZXp2g_BZIm0GrX9bFNiS8pEm0PhkDKbF7fksuZ5ZpgWARgFip_KU9z5Q9tuaSWljCUr5IN0_-I4g6Qd3SJQ4hF3tA_ekDDaOoDdZHTSvJNsPQEmV9YAC_TDMwsrLwu0tD2A8fIb-ryRpKnJiuAdOmYdjEVVIetGR6CLwew5_GIk_1rYPgKxRCJqTa4T5aP0YVGFvi5sg'}
},
{
    name: 'twitter', 
    params: twitterParams, 
    idFieldName: 'creds',
    lookupTest: {creds: 'hebbianloop', address: '0xD638F5c8D434EBf6Ba3a2527bA76B08813b4598e'},
    updateTest: {oldCreds: 'ProtocolWtf', newCreds: 'NanakNihal', newToken: 'eyJraWQiOiJvYWdZIn0.eyJjcmVkcyI6Ik5hbmFrTmloYWwiLCJhdWQiOiJnbm9zaXMiLCJyYW5kIjoibXJOVzVmZWtDUWFqZjhGeGF5NmhsWlpaLVFLLUlUWnhsNWhVRXNwS0ZOZyIsImV4cCI6IjE2NTE4NzE3OTQifQ.KsWjSB2nFBPtk5Cm97aZMFx692JnOp6rcMdayfmsby21_BbJlYf5zc-jy1vYr8uMTtzdQSOdku1V8cBS-ADQ2sHKkoSeilVdjvJqQiMZet09zYIAO60JhHIRTMZym0zTHEyniX93p1e29vrZlANwxNyRF-yHdN6KAg7tgxLJhow7rrBds1t3o_iR9NMO52IbcZE3puaU2Ua9__nFtzQ1sw9CC6Gjiu3VIrBP7dNzRAfC29uDhnCkpB0cPbdvIrCjuSYCuCcE8HGhOMhfnm-zLVcEf16xUZwIGNAI0MDYAZ2lNsnJtkYpnlLrAFY4ojX45OoLZiOdHmbsdX7WqufICw=='}
},
{
    name: 'github', 
    params: githubParams, 
    idFieldName: 'creds',
    lookupTest: {creds: 'seldamat', address: '0xD638F5c8D434EBf6Ba3a2527bA76B08813b4598e'},
    updateTest: {oldCreds: 'nanaknihal', newCreds: 'wtfisaholo', newToken: 'eyJraWQiOiJxN3dXIn0.eyJjcmVkcyI6Ind0ZmlzYWhvbG8iLCJhdWQiOiJnbm9zaXMiLCJyYW5kIjoiMEVCU2lNS3NQeXpfNHNXUlRjXzg0eENHRjBtSl83Vl9JSjQxcjJ3R1BUSSIsImV4cCI6IjE2NTE4NzIxOTMifQ.Xp-IX7muRETTg5CHkxh_gqeZcAyI18D6CaptaBTnAYlW3psIY4VQxyU0nDv-X2E8NpVdv_UaZxh9o6rdb-ouUAe8oWLt7CP590Qg9IpyM4J0n-hG3xXRQcp0sg4zAp3p041hqrZ2s2layFhgqaZ06u3bgTayDYEGACBMCN3lOdZdPG3uXg-diuRPN6mUkpsN07a4r0VwX9OmS5cvsB1sSEDZjHKWWDANo3XQgNjazBrDA9La8GIfoAH__EkpQf-NDmq1vP3T4lG1_-57C7nUjBzYoIamaRtSDXuHRGbvn2eWbjRGJtJh5H20VJrwcsTrZ4y-9Sa1Pswr2kZpbZ4uxw=='},
}]){

    let {name, params, idFieldName, lookupTest, updateTest} = service;

    describe.only('upgrade-specific tests from v1 to v2 for service: ' + name, function(){
        before(async function(){
            this.contract = await upgradeVerifyJWTContract(name)
            await this.contract.changeSandwich(params.idBottomBread, params.idTopBread, params.expBottomBread, params.expTopBread)
            await this.contract.changeAud(params.aud)
        });
    
        
        it('New address is correct', async function(){
            expect(this.contract.address).to.equal(wtf.getContractAddresses().VerifyJWT.gnosis[name])
            expect(this.contract.address).to.not.equal('abc')
        });
    
    
        describe('Old functions with old data work', function(){
            it('Lookup by old credential system still works', async function (){
                const creds = Buffer.from(lookupTest.creds)
                const address = lookupTest.address
                expect(await this.contract.addressForCreds(creds)).to.equal(address)
                expect(await this.contract.credsForAddress(address)).to.equal('0x'+creds.toString('hex'))
            });
            it('Existing user can register new credentials', async function (){
                const [owner] = await ethers.getSigners();
                const [oldCreds, newCreds] = [
                                                '0x' + Buffer.from(updateTest.oldCreds).toString('hex'),
                                                '0x' + Buffer.from(updateTest.newCreds).toString('hex')
                                            ]
                
                // Check that it's currently old creds
                expect(await this.contract.credsForAddress(owner.address)).to.equal(oldCreds)
    
                const params = await getParamsForVerifying(this.contract, updateTest.newToken, idFieldName);
                const commitments = params.generateCommitments(owner.address);
                await this.contract.commitJWTProof(...commitments);
                await ethers.provider.send('evm_mine');
                await this.contract.verifyMe(ethers.BigNumber.from(params.signature), params.message, params.payloadIdx, params.proposedIDSandwich, params.proposedExpSandwich, params.proposedAud)                            
                
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
    
    
    
}
