import {Injectable} from "@angular/core";
import {Actions, Effect} from "@ngrx/effects";
import {Action, Store} from "@ngrx/store";
import {Observable} from "rxjs/Observable";
import {RedeemData} from "altcoinio-wallet";
import {Go, ResetApp} from "../actions/router.action";
import * as sideA from "../actions/side-A.action";
import * as sideB from "../actions/side-B.action";
import {AppState} from "../reducers/app.state";
import {
  getAContractBin,
  getAContractTx,
  getADepositCoin,
  getAHashedSecret,
  getALink,
  getASecret
} from "../selectors/side-a.selector";
import {getSwapProcess} from "../selectors/start.selector";
import {getWalletState} from "../selectors/wallets.selector";
import {LinkService} from "../services/link.service";
import {MoscaService} from "../services/mosca.service";
import {WalletFactory} from "../models/wallets/wallet";
import {OrderService} from "../services/order.service";
import {toPayload} from "../common/util";

@Injectable()
export class SideAEffect {

  @Effect()
  $generateLink: Observable<Action> = this.actions$
    .ofType(sideA.GENERATE_LINK)
    .map(toPayload)
    .withLatestFrom(this.store.select(getWalletState))
    .mergeMap(([payload, wallet]) => {
        const address = this.linkService.generateAddress(payload, wallet);
        const fromAmount = payload.depositCoin.amount;
        const toAmount = payload.receiveCoin.amount;
        const from = payload.depositCoin.name;
        const to = payload.receiveCoin.name;
        return this.orderService.placeOrder(from, to, fromAmount, toAmount, address).map(resp => {
          return new sideA.GenerateLinkSuccessAction(resp);
        }).catch(err => Observable.of(new sideA.GenerateLinkFailAction(err)));
      },
    );

  @Effect()
  $generateLinkSuccess: Observable<Action> = this.actions$
    .ofType(sideA.GENERATE_LINK_SUCCESS)
    .map(toPayload)
    .mergeMap((link) => {
      if (link.side === "a") {
        return Observable.from([
          new sideA.WaitForInitiateAction(link),
          new Go({
            path: ["/transfer"],
          }),
        ]);
      } else {
        return Observable.from([
          new Go({
            path: ["/transfer"],
          }),
        ]);
      }
    });

  @Effect()
  $waitForInitiate: Observable<Action> = this.actions$
    .ofType(sideA.WAIT_FOR_INITIATE)
    .map(toPayload)
    .mergeMap((link) => {
      console.log("WAITING FOR INITIATE", link);
      return this.moscaService.waitForInitiate(link).map(resp => {
        return new sideA.WaitForInitiateSuccessAction(resp);
      }).catch(err => Observable.of(new sideA.WaitForInitiateFailAction(err)));
    });

  @Effect()
  $waitForInitiateSuccess: Observable<Action> = this.actions$
    .ofType(sideA.WAIT_FOR_INITIATE_SUCCESS)
    .map(toPayload)
    .mergeMap((payload) => {
      return Observable.of(new sideA.ParticipateAction(payload));
    });

  @Effect()
  $participate: Observable<Action> = this.actions$
    .ofType(sideA.PARTICIPATE)
    .map(toPayload)
    .withLatestFrom(this.store.select(getSwapProcess))
    .switchMap(([payload, swapProcess]) => {
      const wallet = WalletFactory.createWallet(swapProcess.depositCoin.type);
      console.log("PARTICIPATE COIN", swapProcess.depositCoin);
      return wallet.Participate(payload, swapProcess.depositCoin).map(resp => {
        return new sideA.ParticipateSuccessAction(resp);
      }).catch(err => Observable.of(new sideA.ParticipateFailAction(err)));
    });

  @Effect()
  $participateSuccess: Observable<Action> = this.actions$
    .ofType(sideA.PARTICIPATE_SUCCESS)
    .map(toPayload)
    .mergeMap((payload) => {
      return Observable.from([
        new Go({
          path: ["/a/complete"],
        }),
        new sideA.InformParticipateAction(payload),
      ]);
    });

  @Effect()
  $informParticipate: Observable<Action> = this.actions$
    .ofType(sideA.INFORM_PARTICIPATE)
    .map(toPayload)
    .withLatestFrom(
      this.store.select(getALink),
      this.store.select(getADepositCoin),
      this.store.select(getWalletState),
      this.store.select(getSwapProcess),
      (payload, alink, aDepositCoin, walletState, process) => {
        return {
          payload,
          link: alink,
          wallet: walletState,
          process
        };
      }).mergeMap((data) => {
        // TODO payload contains SECRET ------- TODO please correct this
        console.log("TODO payload contains SECRET ------- TODO please correct this");
        console.log(data);
        const address = data.wallet[data.process.depositCoin.derive === undefined ? data.process.depositCoin.name : data.process.depositCoin.derive].address;
        data.payload = {
          ...data.payload,
          address,
        };
        return this.moscaService.informParticipate(data.link, data.payload).map(() => {
          return new sideA.InformParticipateSuccessAction(data.payload);
        }).catch(err => Observable.of(new sideB.InformInitiateFailAction(err)));
      },
    );

  @Effect()
  $informParticipateSuccess: Observable<Action> = this.actions$
    .ofType(sideA.INFORM_PARTICIPATE_SUCCESS)
    .map(toPayload)
    .mergeMap((payload) => {
      return Observable.of(new sideA.WaitForBRedeemAction(payload));
    });

  @Effect()
  $waitForBRedeem: Observable<Action> = this.actions$
    .ofType(sideA.WAIT_FOR_BREDEEM)
    .map(toPayload)
    .withLatestFrom(
      this.store.select(getALink),
      (payload, alink) => {
        return {
          payload,
          link: alink
        };
      })
    .mergeMap((data) => {
      return this.moscaService.waitForBRedeem(data.link).map(resp => {
        return new sideA.ARedeemAction(resp); // TODO: Extract secret
      }).catch(err => Observable.of(new sideB.WaitForParticipateFailAction(err)));
    });

  @Effect()
  $waitForBRedeemSuccess: Observable<Action> = this.actions$
    .ofType(sideA.WAIT_FOR_BREDEEM_SUCCESS)
    .mergeMap(() => {
      return Observable.empty().map(resp => { // TODO provide implementation
        return new sideA.ExtractSecretAction(resp);
      });
    });

  @Effect()
  $extractSecret: Observable<Action> = this.actions$
    .ofType(sideA.EXTRACT_SECRET)
    .mergeMap(() => {
      return Observable.empty().map(resp => { // TODO provide implementation
        return new sideA.ExtractSecretSuccessAction(resp);
      }).catch(err => Observable.of(new sideA.ExtractSecretFailAction(err)));
    });

  @Effect()
  $extractSecretSuccess: Observable<Action> = this.actions$
    .ofType(sideA.EXTRACT_SECRET_SUCCESS)
    .mergeMap(() => {
      return Observable.empty().map(resp => { // TODO provide implementation
        return new sideA.ARedeemAction(resp);
      });
    });

  @Effect()
  $redeemA: Observable<Action> = this.actions$
    .ofType(sideA.AREDEEM)
    .map(toPayload)
    .withLatestFrom(
      this.store.select(getASecret),
      this.store.select(getAHashedSecret),
      this.store.select(getWalletState),
      this.store.select(getADepositCoin),
      this.store.select(getSwapProcess),
      this.store.select(getAContractBin),
      this.store.select(getAContractTx),
      (payload, secret, hashedSecret, walletState, depositCoin, swapProcess, contractBin, contractTx) => {
        return {
          payload,
          secret,
          hashedSecret,
          walletState,
          depositCoin,
          swapProcess,
          contractBin,
          contractTx
        };
      }).mergeMap((data) => {

      console.log("REDEEM A SIDE:", data);
      const wallet = WalletFactory.createWallet(data.swapProcess.receiveCoin.type);
      return wallet.Redeem(new RedeemData(data.payload.secret, data.payload.secretHash, data.contractBin, data.contractTx), data.swapProcess.receiveCoin).map(resp => {
        console.log("REDEEM RESPONSE:", resp);
        return new sideA.ARedeemSuccessAction(resp);
      }).catch(err => Observable.of(new sideA.ARedeemFailAction(err)));
    });

  @Effect()
  $AredeemSuccess: Observable<Action> = this.actions$
    .ofType(sideA.AREDEEM_SUCCESS)
    .map(toPayload)
    .mergeMap((payload) => {
      return Observable.from([
        new sideA.ADoneAction(payload),
        new Go({path: ["/swap"]}),
      ]);
    });

  @Effect()
  $AredeemFail: Observable<Action> = this.actions$
    .ofType(sideA.AREDEEM_FAIL)
    .mergeMap(() => {
      return Observable.empty().map(resp => { // TODO provide implementation
        return new sideA.ADoneAction(resp);
      });
    });

  @Effect()
  $done: Observable<Action> = this.actions$
    .ofType(sideA.ADONE).delay(2000).mergeMap(() => {
      location.reload();
      return Observable.empty();
    });

  constructor(private actions$: Actions, private linkService: LinkService,
              private store: Store<AppState>, private moscaService: MoscaService, private orderService: OrderService) {

  }
}
