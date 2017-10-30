import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const utils = require('./helpers/Utils');

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

//const SirinCrowdsale = artifacts.require('SirinCrowdsale.sol')
const SirinCrowdsale = artifacts.require('../helpers/SirinCrowdsaleMock.sol')
const SirinSmartToken = artifacts.require('SirinSmartToken.sol')

contract('SirinCrowdsale', function ([_,investor, owner, wallet, walletFounder, walletOEM, walletBounties, walletReserve]) {

  const value = ether(1)

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })
  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1)
    this.afterEndTime = this.endTime + duration.seconds(1)

    this.crowdsale = await SirinCrowdsale.new(this.startTime,
      this.endTime,
      wallet,
      walletFounder,
      walletOEM,
      walletBounties,
      walletReserve,
      {from: owner})

    this.token = SirinSmartToken.at(await this.crowdsale.token())
  })

  describe('Rate Mechanism', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })

    it('Should be on day 1 - 1000 ', async function () {
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 1000);
    });

    it('Should be on day 2 - 950 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(1));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 950);
    });

    it('Should be on day 3 - 900 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(2));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 900);
    });

    it('Should be on day 4 - 855 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(3));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 855);
    });

    it('Should be on day 5 - 810 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(4));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 810);
    });

    it('Should be on day 6 - 770 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(5));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 770);
    });

    it('Should be on day 7 - 730 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(6));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 730);
    });

    it('Should be on day 8 - 690 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(7));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 690);
    });

    it('Should be on day 9 - 650 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(8));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 650);
    });

    it('Should be on day 10 - 615 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(9));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 615);
    });

    it('Should be on day 11 - 580 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(10));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 580);
    });

    it('Should be on day 12 - 550 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(11));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 550);
    });

    it('Should be on day 13 - 525 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(12));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 525);
    });

    it('Should be on day 14 - 500 ', async function () {
      await increaseTimeTo(this.startTime + duration.days(13));
      let rate = await this.crowdsale.getRateMock.call()
      assert.equal(rate, 500);
    });
  })

  describe('Token transfer', function () {

    it('should not allow transfer before after finalize', async function() {

      await increaseTimeTo(this.startTime)
      await this.crowdsale.sendTransaction({value: value, from: investor})

      try {
        await this.token.transfer(walletOEM, 1, {from: investor});
        assert(false, "didn't throw");
      }
      catch (error) {
          return utils.ensureException(error);
      }
    })

    it('should allow transfer after finalize', async function() {

      await increaseTimeTo(this.startTime)
      await this.crowdsale.sendTransaction({value: value, from: investor})

      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.finalize({from: owner})

      await this.token.transfer(walletOEM, 1, {from: walletBounties});
    })
  })

  describe('Finalize allocation', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.sendTransaction({value: value, from: investor})

      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.finalize({from: owner})

      this.totalSupply = await this.token.totalSupply()
    })

    it('Allocate founder token amount as 10% of the total supply', async function () {
      const expectedFounderTokenAmount = this.totalSupply.mul(0.1);
      let walletFounderBalance = await this.token.balanceOf(walletFounder);

      walletFounderBalance.should.be.bignumber.equal(expectedFounderTokenAmount);
    })

    it('Allocate OEM token amount as 10% of the total supply', async function () {
       const expectedOEMTokenAmount =  this.totalSupply.mul(0.1);
       let OEMFounderBalance = await this.token.balanceOf(walletOEM);

       OEMFounderBalance.should.be.bignumber.equal(expectedOEMTokenAmount);
     })

     it('Allocate professional fees and Bounties token amount as 5% of the total supply', async function () {
        const expectedBountiesTokenAmount =  this.totalSupply.mul(0.05);
        let walletFounderBalance = await this.token.balanceOf(walletBounties);

        walletFounderBalance.should.be.bignumber.equal(expectedBountiesTokenAmount);
     })

    it('Allocate Reserve token amount as 35% of the total supply', async function () {
       const expectedReserveTokenAmount =  this.totalSupply.mul(0.35);
       let walletFounderBalance = await this.token.balanceOf(walletReserve);

       walletFounderBalance.should.be.bignumber.equal(expectedReserveTokenAmount);
    })

    it('should set finalized true value', async function () {
        assert.equal(await this.crowdsale.isFinalized(), true);
    })

  })

  describe('Grant tokens', function () {

      /*  it('should grant by owner', async function() {
         try {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.addUpdateGrantee(investor, 100, {from: owner});
            let total = await this.crowdsale._presaleGranteesMap[investor];
            console.log("Grant tokens: " + total)
            if(total != 100){
                 assert(false, "didn't throw");
            }

         }
         catch (error) {
            return utils.ensureException(error);
         }
        })*/

        it('should not grant by none-owner', async function() {
            try {
                await increaseTimeTo(this.startTime)
                await this.crowdsale.addUpdateGrantee(investor, 100, {from: investor});
                assert(false, "didn't throw");
            }
            catch (error) {
              return utils.ensureException(error);
            }
        })

        it('should not be at before crowdsale time', async function() {
            try {
              await increaseTimeTo(this.startTime- duration.days(1))
              await this.crowdsale.addUpdateGrantee(investor, 100, {from: owner});
              assert(false, "didn't throw");
            }
            catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not be at after crowdsale time', async function() {
            try {
              await increaseTimeTo(this.afterEndTime)
              await this.crowdsale.addUpdateGrantee(investor, 100, {from: owner});
              assert(false, "didn't throw");
            }
            catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not grant to address \'0x0\'', async function() {
            try {
              await increaseTimeTo(this.startTime)
              await this.crowdsale.addUpdateGrantee('0x0', 100, {from: owner});
              assert(false, "didn't throw");
            }
            catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not grant value \'0\'', async function() {
            try {
              await increaseTimeTo(this.startTime)
              await this.crowdsale.addUpdateGrantee(investor, 0, {from: owner});
              assert(false, "didn't throw");
            }
            catch (error) {
                return utils.ensureException(error);
            }
        })

       /* it('should not grant to more than MAX_GRANTEE', async function() {
            try {
              let max_grantee = await this.crowdsale.MAX_TOKEN_GRANTEES;
              await increaseTimeTo(this.startTime)

              let address
              for(let i = 0; i <= 20; i++){
                if(i < 10){
                    address = "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b75012" + i
                }else{
                    address = "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501" + i
                }
                console.log("i: " + address)
                await this.crowdsale.addUpdateGrantee(address,100, {from: owner});
              }
              assert(false, "didn't throw");
            }
            catch (error) {
            console.log("error: " + error)
                return utils.ensureException(error);
            }

        })*/

        it('should create an add event', async function() {
             try {
               await increaseTimeTo(this.startTime)
               const {logs} = await this.crowdsale.addUpdateGrantee(investor, 100, {from: owner});

               const event = logs.find(e => e.event === "GrantAdded")
               console.log("logs: " + event)
               should.exist(event)
             }
                catch (error) {
                  return utils.ensureException(error);
             }
        })

        it('should create an update event', async function() {
         try {
               await increaseTimeTo(this.startTime)
               await this.crowdsale.addUpdateGrantee(investor, 100, {from: owner});
               const {logs} = await this.crowdsale.addUpdateGrantee(investor, 50, {from: owner});

               const event = logs.find(e => e.event === "GrantUpdated")
               console.log("logs: " + event)
               should.exist(event)
               }
                 catch (error) {
                 return utils.ensureException(error);
               }
        })

      /*  it('should an update a grantee', async function() {
        })



        it('should remove a grantee by owner', async function() {
        })

        it('should not remove a grantee by none-owner', async function() {
        })

        it('should not remove address 0x0', async function() {
        })

        it('should create remove event', async function() {
        })

        it('should allocate token as expected', async function() {
        })*/
  })


  describe('Total Found', function () {

    it('should start with zero', async function() {
      let total = await this.crowdsale.getTotalFundsRaised();
      assert.equal(total, 0);
    })

    it('should allow only owner account to call setNoneEthRaised', async function() {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.setNoneEthRaised(1, {from: owner});
      let total = await this.crowdsale.getTotalFundsRaised();
      total.should.be.bignumber.equal(1);
    })

    it('should not allow non-owner account to call setNoneEthRaised', async function() {
      try {
        await increaseTimeTo(this.startTime)
        await this.crowdsale.setNoneEthRaised(1, {from: investor});
        assert(false, "didn't throw");
      }
      catch (error) {
          return utils.ensureException(error);
      }
    })

    it('should allow to call setNoneEthRaised only during crowdsale is active', async function() {
      await increaseTimeTo(this.startTime + duration.days(1))
      await this.crowdsale.setNoneEthRaised(1, {from: owner});
      let total = await this.crowdsale.getTotalFundsRaised();
      total.should.be.bignumber.equal(1);
    })

    it('should not be at before crowdsale time', async function() {
      try {
        await increaseTimeTo(this.startTime - duration.days(1))
        await this.crowdsale.setNoneEthRaised(1, {from: owner});
        assert(false, "didn't throw");
      }
      catch (error) {
          return utils.ensureException(error);
      }
    })

    it('should not be at after crowdsale time', async function() {
      try {
        await increaseTimeTo(this.afterEndTime)
        await this.crowdsale.setNoneEthRaised(1, {from: owner});
        assert(false, "didn't throw");
      }
      catch (error) {
          return utils.ensureException(error);
      }
    })

    it('should total amount be equeal to _weiRasied + _noneEthRaised', async function() {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.sendTransaction({value: ether(1), from: investor})
      await this.crowdsale.setNoneEthRaised(ether(1), {from: owner});
      let total = await this.crowdsale.getTotalFundsRaised();

      total.should.be.bignumber.equal(ether(2));
    })

  })

})
