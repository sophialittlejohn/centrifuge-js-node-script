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
        "0x5e66168eba05484ef26bf258f9c9dd3a7d8d6338203ebb52f77cffa7bad34d1f"
      );
    }),
    switchMap((api) => {
      const pools = centrifuge.pools.getPools();
      return combineLatest([api, pools]);
    }),
    switchMap(([api, pools]) => {
      const poolCalls = pools.map((pool) => {
        const trancheTotalIssuance = pool.tranches.map((tranche) =>
          api.query.ormlTokens.totalIssuance({
            Tranche: [pool.id, tranche.id],
          })
        );
        return forkJoin([
          api.call.poolsApi.nav(pool.id),
          api.call.loansApi.portfolio(pool.id),
          api.call.poolsApi.trancheTokenPrices(pool.id),
          ...trancheTotalIssuance,
        ]).pipe(
          map(([nav, portfolio, trancheTokenPrices, ...totalIssuance]) => {
            return {
              poolId: pool.id,
              nav: nav.toJSON(),
              portfolio: portfolio.toJSON(),
              trancheTokenPrices: trancheTokenPrices.toJSON(),
              totalIssuance,
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
