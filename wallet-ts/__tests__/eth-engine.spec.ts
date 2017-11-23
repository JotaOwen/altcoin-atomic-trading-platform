import "jest";
import {AtomicSwapAbi} from "../src/config/abi/atomicswap";
import {AtomicSwapBin} from "../src/config/abi/bin";
import {EthConfiguration} from "../src/config/config-eth";
import {EthEngine} from "../src/eth/eth-engine";

describe.only("EthEngine", () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  it.only("Should pass sanity", () => {
    expect(typeof EthEngine).toBe("function");
  });

  it.only("Should be pass sanity", async () => {
    const ethEngine = new EthEngine(AtomicSwapAbi, EthConfiguration.hosts[0], AtomicSwapBin);
    const newAccount = ethEngine.createAccount("customPassword");
    const address = newAccount.wallet.address;
    const store = newAccount.keystore;
    const accountRelogged = ethEngine.login(store, "customPassword");
    expect(accountRelogged.address).toEqual(address);

    console.log("address ", await ethEngine.getBalance(address));
  });

});