import backgroundApiProxy from '../../../../background/instance/backgroundApiProxy';
import { appSelector } from '../../../../store';
import {
  addWebSiteHistory,
  setDappHistory,
  updateHistory,
} from '../../../../store/reducers/discover';
import {
  addWebTab,
  closeWebTab,
  setWebTabData,
} from '../../../../store/reducers/webTabs';
import { openUrl } from '../../../../utils/openUrl';
import { WebSiteHistory } from '../../type';
import {
  MatchDAppItemType,
  crossWebviewLoadUrl,
  validateUrl,
  webHandler,
} from '../explorerUtils';

export const gotoSite = ({
  url,
  title,
  favicon,
  dAppId,
  isNewWindow,
  isInPlace,
  id,
}: WebSiteHistory & {
  dAppId?: string;
  isNewWindow?: boolean;
  isInPlace?: boolean;
  id?: string;
}) => {
  const {
    webTabs: { tabs, currentTabId },
    discover: { dappFavorites },
  } = appSelector((s) => s);
  const curId = id || currentTabId;
  const tab = tabs.find((t) => t.id === curId);
  const { dispatch } = backgroundApiProxy;
  if (url && tab) {
    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      return;
    }
    if (webHandler === 'browser') {
      return openUrl(validatedUrl);
    }
    const tabId = tab.id;
    const isDeepLink =
      !validatedUrl.startsWith('http') && validatedUrl !== 'about:blank';
    const isNewTab =
      (isNewWindow || tabId === 'home' || isDeepLink) &&
      webHandler === 'tabbedWebview';

    if (dAppId) {
      dispatch(setDappHistory(dAppId));
    }
    const isBookmarked = dappFavorites?.includes(url);

    dispatch(
      isNewTab
        ? addWebTab({
            title,
            url: validatedUrl,
            favicon,
            isCurrent: true,
            isBookmarked,
          })
        : setWebTabData({
            id: tabId,
            url: validatedUrl,
            title,
            favicon,
            isBookmarked,
          }),
      dAppId
        ? updateHistory(dAppId)
        : addWebSiteHistory({
            webSite: { url: validatedUrl, title, favicon },
          }),
    );

    if (!isNewTab && !isInPlace) {
      crossWebviewLoadUrl({
        url: validatedUrl,
        tabId,
      });
    }

    // close deep link tab after 1s
    if (isDeepLink) {
      if (webHandler === 'tabbedWebview') {
        setTimeout(() => {
          dispatch(closeWebTab(tabId));
        }, 1000);
      }
    }
    return true;
  }
  return false;
};
export const openMatchDApp = ({
  dapp,
  webSite,
  isNewWindow,
}: MatchDAppItemType) => {
  if (webSite) {
    return gotoSite({
      url: webSite.url,
      title: webSite.title,
      favicon: webSite.favicon,
      isNewWindow,
    });
  }

  if (dapp) {
    // const {
    //   webTabs: { tabs, currentTabId },
    //   discover: { firstRemindDAPP },
    // } = appSelector((s) => s);
    // const tab = tabs.find((t) => t.id === currentTabId);

    // if (dapp.url !== tab?.url && firstRemindDAPP) {
    //   const { dispatch } = backgroundApiProxy;
    //   let dappOpenConfirm: ((confirm: boolean) => void) | undefined;
    //   DialogManager.show({
    //     render: (
    //       <DappOpenHintDialog
    //         onVisibilityChange={() => {
    //           dappOpenConfirm = undefined;
    //         }}
    //         onConfirm={() => {
    //           dappOpenConfirm?.(true);
    //         }}
    //       />
    //     ),
    //   });

    //   const isConfirm = await new Promise<boolean>((resolve) => {
    //     dappOpenConfirm = resolve;
    //   });

    //   if (!isConfirm) {
    //     return false;
    //   }

    //   dispatch(updateFirstRemindDAPP(false));
    // }

    return gotoSite({
      url: dapp.url,
      title: dapp.name,
      dAppId: dapp._id,
      favicon: dapp.logoURL,
      isNewWindow,
    });
  }
};
