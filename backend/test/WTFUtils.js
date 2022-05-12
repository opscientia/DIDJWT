const { expect } = require('chai');
const { ethers } = require('hardhat');
// const { deployVerifyJWTContract, orcidParams } = require('../utils');

describe('slicing of byte array', function (){
    before(async function(){
      [this.owner] = await ethers.getSigners();
      this.wu = await (await ethers.getContractFactory('WTFUtils')).deploy()
    });
  
    it('slicing raw bytes gives correct result', async function () {
      expect(await this.wu.sliceBytesMemory([5, 6, 1, 3], 1,2)).to.equal('0x06');
      expect(await this.wu.sliceBytesMemory([5, 6, 1, 3], 0,3)).to.equal('0x050601'); 
      expect(await this.wu.sliceBytesMemory([5, 6, 1, 3], 1,4)).to.equal('0x060103'); 
      expect(await this.wu.sliceBytesMemory([5, 6, 1, 3], 0,4)).to.equal('0x05060103'); 
    });
  
    it('slicing hex string gives correct result', async function () {
      expect(await this.wu.sliceBytesMemory('0x05060103', 1,2)).to.equal('0x06');
      expect(await this.wu.sliceBytesMemory('0x05060103', 0,3)).to.equal('0x050601'); 
      expect(await this.wu.sliceBytesMemory('0x05060103', 1,4)).to.equal('0x060103'); 
      expect(await this.wu.sliceBytesMemory('0x05060103', 0,4)).to.equal('0x05060103'); 
    });
  
    it('slicing actual JWT gives correct result', async function () {
      expect(await this.wu.sliceBytesMemory('0x7b226b6964223a2270726f64756374696f6e2d6f726369642d6f72672d3768646d64737761726f736733676a756a6f3861677774617a676b70316f6a73222c22616c67223a225253323536227d007b2261745f68617368223a225f54424f654f67655937304f5670474563434e2d3351222c22617564223a224150502d4d504c4930465152555646454b4d5958222c22737562223a22303030302d303030322d323330382d39353137222c22617574685f74696d65223a313634343833303139312c22697373223a2268747470733a5c2f5c2f6f726369642e6f7267222c22657870223a313634343931383533372c22676976656e5f6e616d65223a224e616e616b204e6968616c222c22696174223a313634343833323133372c2266616d696c795f6e616d65223a224b68616c7361222c226a7469223a2237313364633066622d333065302d343334322d393831632d336562326231346238333438227d', 143, 171)).to.equal('0x22737562223a22303030302d303030322d323330382d39353137222c');
    });
  });

describe('modExp works', function () {
    it('Test modExp on some simple numbers', async function () {
        const [owner] = await ethers.getSigners();
        const wu = await (await ethers.getContractFactory('WTFUtils')).deploy()
        expect(await wu.modExp(0x004b,1,8001)).to.equal('0x004b')
        expect(await wu.modExp(5,5,5)).to.equal('0x00');
        expect(await wu.modExp(0,1,6)).to.equal('0x00');
        expect(await wu.modExp(5,2,23)).to.equal('0x02');
    });
});