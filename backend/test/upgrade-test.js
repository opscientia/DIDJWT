// Forks current VJWT contract(s) onto local hardhat network, upgrades them, and runs existing tests on them
const { expect } = require('chai');
const { network, ethers, upgrades } = require('hardhat');
const wtf = require('wtf-lib');

let contractAddresses = wtf.getContractAddresses()

const upgradeVJWT = async (address) => {
    let VJWT = await ethers.getContractFactory('VerifyJWT')
    let NewVJWT = await ethers.getContractFactory('VerifyJWTv2')
    // Import the implementation if it's not already loaded:
    await upgrades.forceImport(address, VJWT, {kind : 'uups'})
    let vjwt = await upgrades.upgradeProxy(address, NewVJWT)
    return vjwt
}
describe.only('Old functions with old data work', function(){
    before(async function(){
        // Upgrade the contract
        let contract = await (await ethers.getContractFactory('VerifyJWT')).attach(contractAddresses.VerifyJWT.gnosis.google)
        this.contract = await upgradeVJWT(contract.address)
    })
    it('Lookup by old credential system still works', async function (){
        const email = Buffer.from('shady@opscientia.com')
        const address = '0xD638F5c8D434EBf6Ba3a2527bA76B08813b4598e'
        expect(await this.contract.addressForCreds(email)).to.equal(address)
        expect(await this.contract.credsForAddress(address)).to.equal('0x'+email.toString('hex'))
    })
    
})

describe.only('New functions with old data work', function(){
    before(async function(){
        // Upgrade the contract
        let contract = await (await ethers.getContractFactory('VerifyJWT')).attach(contractAddresses.VerifyJWT.gnosis.google)
        this.contract = await upgradeVJWT(contract.address)
    })
    it('New abc test function works', async function (){
        // expect(await this.contract.abc()).to.equal('def')
        // await this.contract.testTimeAssumptions()
    })    
})