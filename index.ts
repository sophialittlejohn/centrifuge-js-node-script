import "@polkadot/api-augment";
import Centrifuge from "@centrifuge/centrifuge-js";
import { firstValueFrom, switchMap, combineLatest, map, forkJoin } from "rxjs";

const centrifuge = new Centrifuge({
  centrifugeWsUrl: "wss://fullnode.development.cntrfg.com",
});

const main = async () => {
  const poolData = centrifuge.getApi().pipe(
    map((api) => {
      return api.at(
        "0xd96aba180357599933e246625ccd161c0ea90d7704e3f9e3bc67f06c040d10ac"
      );
    }),
    switchMap((api) => {
      const pools = centrifuge.pools.getPools();
      return combineLatest([api, pools]);
    }),
    switchMap(([api, pools]) => {
      const poolIds = pools.map((pool) => pool.id);
      const poolCalls = poolIds.map((poolId) => {
        return forkJoin([
          api.call.poolsApi.nav(poolId),
          api.call.loansApi.portfolio(poolId),
          api.call.poolsApi.trancheTokenPrices(poolId),
        ]).pipe(
          map(([nav, portfolio, trancheTokenPrices]) => {
            return {
              poolId,
              nav: nav.toJSON(),
              portfolio: portfolio.toJSON(),
              trancheTokenPrices: trancheTokenPrices.toJSON(),
            };
          })
        );
      });
      return forkJoin(poolCalls);
    })
  );

  const results = await firstValueFrom(poolData);
  console.log(results);
  return results;
};

main().catch(console.error);
