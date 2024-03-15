import "@polkadot/api-augment";
import Centrifuge from "@centrifuge/centrifuge-js";
import { take, firstValueFrom, switchMap, combineLatest, map } from "rxjs";

const centrifuge = new Centrifuge({
  centrifugeWsUrl: "wss://fullnode.development.cntrfg.com",
});

const main = async () => {
  const api = centrifuge.getApi();
  const pools = await firstValueFrom(centrifuge.pools.getPools());
  const poolIds = pools.map((pool) => pool.id);
  const results = await Promise.all(
    poolIds.map(async (poolId) => {
      return firstValueFrom(
        api.pipe(
          switchMap((api) => {
            return combineLatest([
              api.call.poolsApi.nav(poolId),
              api.call.loansApi.portfolio(poolId),
              api.call.poolsApi.trancheTokenPrices(poolId),
            ]);
          }),
          map(([nav, portfolio, trancheTokenPrices]) => {
            return {
              poolId: poolId,
              nav: nav.toJSON(),
              portfolio: portfolio.toJSON(),
              trancheTokenPrices: trancheTokenPrices.toJSON(),
            };
          }),
          take(1)
        )
      );
    })
  );
  console.log(results);
};

main().catch(console.error);
