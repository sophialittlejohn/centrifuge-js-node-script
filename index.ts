import "@polkadot/api-augment";
import Centrifuge from "@centrifuge/centrifuge-js";
import { take, firstValueFrom, switchMap, combineLatest } from "rxjs";

const centrifuge = new Centrifuge();
const anemoyPoolId = "4139607887";

const main = async () => {
  const api = centrifuge.getApi();
  const results = await firstValueFrom(
    api.pipe(
      switchMap((api) =>
        combineLatest([
          api.call.poolsApi.nav(anemoyPoolId),
          api.call.loansApi.portfolio(anemoyPoolId),
          api.call.poolsApi.trancheTokenPrices(anemoyPoolId),
        ])
      ),
      take(1)
    )
  );
  console.log("results:", results);
};

main().catch(console.error);
