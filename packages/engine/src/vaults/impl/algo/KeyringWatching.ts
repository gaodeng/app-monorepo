import * as sdk from 'algosdk';

import { COINTYPE_ALGO as COIN_TYPE } from '../../../constants';
import { AccountType, DBSimpleAccount } from '../../../types/account';
import { KeyringWatchingBase } from '../../keyring/KeyringWatchingBase';

import type { IPrepareWatchingAccountsParams } from '../../types';

export class KeyringWatching extends KeyringWatchingBase {
  override async prepareAccounts(
    params: IPrepareWatchingAccountsParams,
  ): Promise<Array<DBSimpleAccount>> {
    const { name, target, accountIdPrefix } = params;

    const address = await this.vault.validateAddress(target);
    const { publicKey } = sdk.decodeAddress(address);

    return Promise.resolve([
      {
        id: `${accountIdPrefix}--${COIN_TYPE}--${target}`,
        name: name || '',
        type: AccountType.SIMPLE,
        path: '',
        coinType: COIN_TYPE,
        pub: `${Buffer.from(publicKey).toString('hex')}`,
        address,
      },
    ]);
  }
}
