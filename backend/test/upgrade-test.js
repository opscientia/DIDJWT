// Forks current VJWT contract(s) onto local hardhat network, upgrades them, and runs existing tests on them
const { expect } = require('chai');
const { network, ethers, upgrades } = require('hardhat');
const wtf = require('wtf-lib');
const {
upgradeVerifyJWTContract,
  } = require('./utils/utils');


describe.only('upgrade-specific tests from v1 to v2', function(){
    before(async function(){
        this.contract = await upgradeVerifyJWTContract('google')
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
        it('IMPORTANT : MAKE SURE TO ALSO TEST THAT EXISTING USER CAN RENEW THEIR JWT OR REGISTER WITH NEW CREDENTIALS', async function (){
            // expect(await this.contract.abc()).to.equal('def')
            // await this.contract.testTimeAssumptions()
            expect(false).to.equal(true)
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


