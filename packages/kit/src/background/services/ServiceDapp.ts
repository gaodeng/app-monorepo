import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import {
  IJsBridgeMessagePayload,
  IJsonRpcRequest,
} from '@onekeyfe/cross-inpage-provider-types';
import { cloneDeep, debounce } from 'lodash';

import { IMPL_SOL, SEPERATOR } from '@onekeyhq/engine/src/constants';
import { isAccountCompatibleWithNetwork } from '@onekeyhq/engine/src/managers/account';
import { getActiveWalletAccount } from '@onekeyhq/kit/src/hooks/redux';
import { buildModalRouteParams } from '@onekeyhq/kit/src/provider/useAutoNavigateOnMount';
import {
  DappSiteConnection,
  DappSiteConnectionRemovePayload,
  DappSiteConnectionSavePayload,
  dappRemoveSiteConnections,
  dappSaveSiteConnection,
} from '@onekeyhq/kit/src/store/reducers/dapp';
import extUtils from '@onekeyhq/kit/src/utils/extUtils';
import { DappConnectionModalRoutes } from '@onekeyhq/kit/src/views/DappModals/types';
import { ManageNetworkRoutes } from '@onekeyhq/kit/src/views/ManageNetworks/types';
import { ManageTokenRoutes } from '@onekeyhq/kit/src/views/ManageTokens/types';
import { SendRoutes } from '@onekeyhq/kit/src/views/Send/types';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import { ModalRoutes, RootRoutes } from '../../routes/routesEnum';
import { getTimeDurationMs, wait } from '../../utils/helper';
import { backgroundClass, backgroundMethod } from '../decorators';
import { IDappSourceInfo } from '../IBackgroundApi';
import {
  ensureSerializable,
  getNetworkImplFromDappScope,
  isDappScopeMatchNetwork,
  waitForDataLoaded,
} from '../utils';

import ServiceBase from './ServiceBase';

import type { IDappSignAndSendParams } from '../../hooks/useDappParams';

type CommonRequestParams = {
  request: IJsBridgeMessagePayload;
};

@backgroundClass()
class ServiceDapp extends ServiceBase {
  isSendConfirmModalVisible = false;

  // TODO remove after dapp request queue implemented.
  @backgroundMethod()
  setSendConfirmModalVisible({ visible }: { visible: boolean }) {
    this.isSendConfirmModalVisible = visible;
  }

  async processBatchTransactionOneByOne({ run }: { run: () => Promise<void> }) {
    this.isSendConfirmModalVisible = true;

    await run();

    // set isSendConfirmModalVisible=false in SendFeedbackReceipt.tsx
    await waitForDataLoaded({
      data: () => !this.isSendConfirmModalVisible,
      timeout: getTimeDurationMs({ minute: 1 }),
      logName: 'processBatchTransactionOneByOne wait isSendConfirmModalVisible',
    });
    await wait(1000);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  @backgroundMethod()
  async getActiveConnectedAccountsAsync({
    origin,
    impl,
  }: {
    origin: string;
    impl: string;
  }) {
    return this.getActiveConnectedAccounts({ origin, impl });
  }

  // TODO add IInjectedProviderNames or scope
  getActiveConnectedAccounts({
    origin,
    impl,
  }: {
    origin: string;
    impl: string;
  }): DappSiteConnection[] {
    const { appSelector } = this.backgroundApi;
    const { accountAddress, accountId } = getActiveWalletAccount();
    const connections: DappSiteConnection[] = appSelector(
      (s) => s.dapp.connections,
    );
    const { isUnlock } = appSelector((s) => s.status);
    if (!isUnlock) {
      // TODO unlock status check
      //   return [];
    }
    const accounts = connections
      .filter(
        (item) => {
          try {
            return (
              // only match hostname
              new URL(item.site.origin).hostname === new URL(origin).hostname &&
              item.networkImpl === impl
            );
          } catch {
            return false;
          }
        },
        // && item.address === accountAddress, // only match current active account
      )
      .filter((item) => item.address && item.networkImpl);

    if (accounts.length) {
      const list = cloneDeep(accounts);
      // support all accounts for dapp connection, do NOT need approval again
      list.forEach((item) => {
        if (
          isAccountCompatibleWithNetwork(
            accountId,
            `${item.networkImpl}${SEPERATOR}1`,
          )
        ) {
          item.address = accountAddress;
        }
      });
      return list;
    }
    return accounts;
  }

  @backgroundMethod()
  saveConnectedAccounts(payload: DappSiteConnectionSavePayload) {
    this.backgroundApi.dispatch(dappSaveSiteConnection(payload));
  }

  @backgroundMethod()
  removeConnectedAccounts(payload: DappSiteConnectionRemovePayload) {
    this.backgroundApi.dispatch(dappRemoveSiteConnections(payload));
    setTimeout(() => {
      this.backgroundApi.serviceAccount.notifyAccountsChanged();
    }, 1500);
  }

  @backgroundMethod()
  async cancellConnectedSite(payload: DappSiteConnection): Promise<void> {
    // check walletConnect
    if (
      this.backgroundApi.walletConnect.connector &&
      this.backgroundApi.walletConnect.connector.peerMeta?.url ===
        payload.site.origin
    ) {
      this.backgroundApi.walletConnect.disconnect();
    }
    this.removeConnectedAccounts({
      origin: payload.site.origin,
      networkImpl: payload.networkImpl,
      addresses: [payload.address],
    });
    await this.backgroundApi.serviceAccount.notifyAccountsChanged();
  }

  @backgroundMethod()
  async getWalletConnectSession() {
    if (this.backgroundApi.walletConnect.connector) {
      const { session } = this.backgroundApi.walletConnect.connector;
      return Promise.resolve(
        this.backgroundApi.walletConnect.connector.connected ? session : null,
      );
    }
  }

  // TODO to decorator @permissionRequired()
  authorizedRequired(request: IJsBridgeMessagePayload) {
    if (!this.isDappAuthorized(request)) {
      throw web3Errors.provider.unauthorized();
    }
  }

  isDappAuthorized(request: IJsBridgeMessagePayload) {
    if (!request.scope) {
      return false;
    }
    const impl = getNetworkImplFromDappScope(request.scope);
    if (!impl) {
      return false;
    }
    const accounts = this.backgroundApi.serviceDapp?.getActiveConnectedAccounts(
      {
        origin: request.origin as string,
        impl,
      },
    );
    return Boolean(accounts && accounts.length);
  }

  @backgroundMethod()
  async openConnectionModal(request: CommonRequestParams['request']) {
    const result = await this.openModal({
      request,
      screens: [
        ModalRoutes.DappConnectionModal,
        DappConnectionModalRoutes.ConnectionModal,
      ],
    });
    await wait(200);
    this.backgroundApi.serviceAccount.notifyAccountsChanged();
    await wait(200);
    return result;
  }

  // TODO support dapp accountId & networkId
  openSignAndSendModal(
    request: IJsBridgeMessagePayload,
    params: IDappSignAndSendParams,
  ) {
    // Move authorizedRequired to UI check
    // this.authorizedRequired(request);

    return this.openModal({
      request,
      screens: [ModalRoutes.Send, SendRoutes.SendConfirmFromDapp],
      params,
      isAuthorizedRequired: true,
    });
  }

  openAddTokenModal(request: IJsBridgeMessagePayload, params: any) {
    return this.openModal({
      request,
      screens: [ModalRoutes.ManageToken, ManageTokenRoutes.AddToken],
      params,
    });
  }

  openAddNetworkModal(request: IJsBridgeMessagePayload, params: any) {
    return this.openModal({
      request,
      screens: [
        ModalRoutes.ManageNetwork,
        ManageNetworkRoutes.AddNetworkConfirm,
      ],
      params,
    });
  }

  openSwitchNetworkModal(request: IJsBridgeMessagePayload, params: any) {
    return this.openModal({
      request,
      screens: [ModalRoutes.ManageNetwork, ManageNetworkRoutes.SwitchNetwork],
      params,
    });
  }

  isSendModalExisting() {
    return (
      (
        global.$navigationRef.current
          ?.getState()
          ?.routes?.find((item) => item?.name === RootRoutes.Modal)?.params as {
          screen?: ModalRoutes;
        }
      )?.screen === ModalRoutes.Send
    );
  }

  _openModalByRouteParams = ({
    modalParams,
    routeParams,
    routeNames,
  }: {
    routeNames: any[];
    routeParams: { query: string };
    modalParams: { screen: any; params: any };
  }) => {
    if (platformEnv.isExtension) {
      extUtils.openStandaloneWindow({
        routes: routeNames,
        params: routeParams,
      });
    } else {
      const doOpenModal = () =>
        global.$navigationRef.current?.navigate(
          modalParams.screen,
          modalParams.params,
        );
      // TODO remove timeout after dapp request queue implemented.
      setTimeout(() => doOpenModal(), this.isSendModalExisting() ? 1000 : 0);
    }
  };

  _openModalByRouteParamsDebounced = debounce(
    this._openModalByRouteParams,
    800,
    {
      leading: false,
      trailing: true,
    },
  );

  async openModal({
    request,
    screens = [],
    params = {},
    isAuthorizedRequired,
  }: {
    request: IJsBridgeMessagePayload;
    screens: any[];
    params?: any;
    isAuthorizedRequired?: boolean;
  }) {
    const { network } = getActiveWalletAccount();
    const isNotAuthorized = !this.isDappAuthorized(request);
    let isNotMatchedNetwork = !isDappScopeMatchNetwork(
      request.scope,
      network?.impl,
    );
    let shouldShowNotMatchedNetworkModal = true;
    const requestMethod = (request.data as IJsonRpcRequest)?.method || '';
    const notMatchedErrorMessage = `OneKey Wallet chain/network not matched. method=${requestMethod} scope=${
      request.scope || ''
    } origin=${request.origin || ''}`;

    if (isAuthorizedRequired && isNotAuthorized) {
      // TODO show different modal for isNotAuthorized
      isNotMatchedNetwork = true;
    }

    if (
      isNotMatchedNetwork &&
      request.origin === 'https://opensea.io' &&
      request.scope === 'solana' &&
      network?.impl !== IMPL_SOL
    ) {
      shouldShowNotMatchedNetworkModal = false;
    }

    return new Promise((resolve, reject) => {
      const id = this.backgroundApi.servicePromise.createCallback({
        resolve,
        reject,
      });
      let modalScreens = screens;
      // TODO not matched network modal should be singleton and debounced
      if (isNotMatchedNetwork) {
        modalScreens = [
          ModalRoutes.DappConnectionModal,
          DappConnectionModalRoutes.NetworkNotMatchModal,
        ];
      }
      const routeNames = [RootRoutes.Modal, ...modalScreens];
      const sourceInfo = {
        id,
        origin: request.origin,
        scope: request.scope, // ethereum
        data: request.data,
      } as IDappSourceInfo;
      const routeParams = {
        // stringify required, nested object not working with Ext route linking
        query: JSON.stringify(
          {
            sourceInfo, // TODO rename $sourceInfo
            ...params,
            _$t: Date.now(),
          },
          (key, value) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            typeof value === 'bigint' ? value.toString() : value,
        ),
      };

      const modalParams = buildModalRouteParams({
        screens: routeNames,
        routeParams,
      });

      ensureSerializable(modalParams);

      if (isNotMatchedNetwork) {
        if (shouldShowNotMatchedNetworkModal) {
          this._openModalByRouteParamsDebounced({
            routeNames,
            routeParams,
            modalParams,
          });
        }

        if (requestMethod === 'eth_requestAccounts') {
          // some dapps like https://polymm.finance/ will call `eth_requestAccounts` infinitely if reject() on Mobile
          // so we should resolve([]) here
          resolve([]);
        } else {
          let error = new Error(notMatchedErrorMessage);
          if (isAuthorizedRequired && isNotAuthorized) {
            // debugLogger.dappApprove.error(web3Errors.provider.unauthorized());
            error = web3Errors.provider.unauthorized();
          }
          reject(error);
        }
      } else {
        this._openModalByRouteParams({
          routeNames,
          routeParams,
          modalParams,
        });
      }
    });
  }
}

export default ServiceDapp;
