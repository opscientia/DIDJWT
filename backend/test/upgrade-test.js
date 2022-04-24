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
        console.log(contractAddresses.VerifyJWT.gnosis.google)
        let contract = await (await ethers.getContractFactory('VerifyJWT')).attach(contractAddresses.VerifyJWT.gnosis.google)
        await upgradeVJWT(contract.address)
    })
    it('Lookup by old email still works', async function (){
        // expect(await this.contract.addressForCreds(Buffer.from('wtfprotocol@gmail.com'))).to.equal('0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388')
        // expect(await this.contract.credsForAddress('0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388')).to.equal('wtfprotoco@gmail.com')
    })
    // Should be new describe:
    it('New abc test function works', async function (){
        // expect(await this.contract.abc()).to.equal('def')
    })
})

