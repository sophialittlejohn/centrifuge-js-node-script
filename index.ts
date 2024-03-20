import "@polkadot/api-augment";
import Centrifuge from "@centrifuge/centrifuge-js";
import { firstValueFrom, switchMap, combineLatest, map } from "rxjs";

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
              api.at(
                "0xd96aba180357599933e246625ccd161c0ea90d7704e3f9e3bc67f06c040d10ac"
              ),
            ]);
          }),
          map(([nav, portfolio, trancheTokenPrices, atCall]) => {
            return {
              poolId: poolId,
              nav: nav.toJSON(),
              portfolio: portfolio.toJSON(),
              trancheTokenPrices: trancheTokenPrices.toJSON(),
              atCall,
            };
          })
        )
      );
    })
  );
  console.log(results);
  return results;
};

main().catch(console.error);
