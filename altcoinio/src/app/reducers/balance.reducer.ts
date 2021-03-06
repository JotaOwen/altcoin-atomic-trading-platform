import * as balance from "../actions/balance.action";

export interface WalletRecord {
  address: string;
  balance: string;
  name: string;
  loading: boolean;
}

export interface State {
  ETH: WalletRecord;
  BTC: WalletRecord;
  REP: WalletRecord;
  TOKENS: Map<string, WalletRecord>;
}

export const initialState: State = {
  ETH: undefined,
  BTC: undefined,
  REP: undefined,
  TOKENS: new Map<string, WalletRecord>(),
};

export function reducer(state = initialState, action: balance.Actions): State {
  switch (action.type) {
    case balance.GET_ETH_BALANCE: {
      return {
        ...state,
        ETH: {
          ...state.ETH,
          loading: true,
        }
      };
    }
    case balance.GET_BTC_BALANCE: {
      return {
        ...state,
        BTC: {
          ...state.BTC,
          loading: true,
        }
      };
    }
    case balance.GET_REP_BALANCE: {
      return {
        ...state,
        REP: {
          ...state.REP,
          loading: true
        }
      };
    }
    case balance.GET_REP_BALANCE_SUCCESS: {
      return {
        ...state,
        REP: {
          ...state.REP,
          loading: false,
          balance: action.payload
        }
      };
    }
    case balance.GET_TOKEN_BALANCE: {
      const newState = {
        ...state
      };
      const token = state.TOKENS[action.payload.name] = {} as WalletRecord;
      token.loading = true;
      return newState;
    }
    case balance.GET_TOKEN_BALANCE_SUCCESS: {
      const newState = {
        ...state
      };
      //console.log('old state ', state);
      //console.log('token balance success for ', action.payload);
      const token = state.TOKENS[action.payload.name];
      token.loading = false;
      token.address = action.payload.address;
      token.balance = action.payload.balance;
      //console.log('new state ', newState);
      return newState;
    }
    case balance.GET_ETH_BALANCE_SUCCESS: {
      return {
        ...state,
        ETH: {
          ...state.ETH,
          balance: action.payload.balance,
          address: action.payload.address,
          loading: false
        },
      };
    }

    case balance.GET_BTC_BALANCE_SUCCESS: {
      return {
        ...state,
        BTC: {
          ...state.BTC,
          balance: action.payload.balance,
          address: action.payload.address,
          loading: false
        },
      };
    }

    default: {
      return state;
    }
  }
}

export const getEthLoading = (state: State) => state.ETH.loading;
export const getBtcLoading = (state: State) => state.BTC.loading;
export const getRepLoading = (state: State) => state.REP.loading;
export const getTokenLoadingAugur = (state: State) => state.TOKENS["augur"].loading;
export const getTokenLoadingGolem = (state: State) => state.TOKENS["golem"].loading;
export const getTokenLoadingGnosis = (state: State) => state.TOKENS["gnosis"].loading;
export const getTokenLoadingBat = (state: State) => state.TOKENS["bat"].loading;
export const getTokenLoadingAragon = (state: State) => state.TOKENS["aragon"].loading;
export const getTokenLoadingEos = (state: State) => state.TOKENS["eos"].loading;
export const getTokenLoadingSalt = (state: State) => state.TOKENS["salt"].loading;
export const getETHBalance = (state: State) => state.ETH;
export const getBTCBalance = (state: State) => state.BTC;
export const getREPBalance = (state: State) => state.REP;
export const getTokenBalances = (state: State) => state.TOKENS;
export const getTokenBalanceAugur = (state: State) => state.TOKENS["augur"];
export const getTokenBalanceGolem = (state: State) => state.TOKENS["golem"];
export const getTokenBalanceGnosis = (state: State) => state.TOKENS["gnosis"];
export const getTokenBalanceBat = (state: State) => state.TOKENS["bat"];
export const getTokenBalanceAragon = (state: State) => state.TOKENS["aragon"];
export const getTokenBalanceEos = (state: State) => state.TOKENS["eos"];
export const getTokenBalanceSalt = (state: State) => state.TOKENS["salt"];
export const getTokenBalanceCivic = (state: State) => state.TOKENS["cvc"];
export const getTokenBalanceOmiseGo = (state: State) => state.TOKENS["omg"];
export const getTokenBalanceDistrict0x = (state: State) => state.TOKENS["dnt"];
export const getTokenBalanceStatusNetwork = (state: State) => state.TOKENS["snt"];
export const getTokenBalanceSubstratum = (state: State) => state.TOKENS["sub"];
export const getTokenBalanceTron = (state: State) => state.TOKENS["trx"];
export const getTokenBalanceBytom = (state: State) => state.TOKENS["btm"];
export const getTokenBalanceDent = (state: State) => state.TOKENS["dent"];

