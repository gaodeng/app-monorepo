import React from 'react';

import { useIsVerticalLayout } from '@onekeyhq/components';
import { Network } from '@onekeyhq/engine/src/types/network';
import { Collection, NFTAsset } from '@onekeyhq/engine/src/types/nft';
import CollectionModalView from '@onekeyhq/kit/src/views/Wallet/NFT/CollectionModal';
import NFTDetailView from '@onekeyhq/kit/src/views/Wallet/NFT/NFTDetail';

import { buildModalStackNavigatorOptions } from './buildModalStackNavigatorOptions';
import createStackNavigator from './createStackNavigator';

export enum CollectiblesModalRoutes {
  CollectionModal = 'CollectionModal',
  NFTDetailModal = 'NFTDetailModal',
}

export type CollectiblesRoutesParams = {
  [CollectiblesModalRoutes.CollectionModal]: {
    collectible: Collection;
    network: Network;
  };
  [CollectiblesModalRoutes.NFTDetailModal]: {
    asset: NFTAsset;
    network: Network;
    isOwner: boolean;
  };
};

const CollectibleNavigator = createStackNavigator<CollectiblesRoutesParams>();

const modalRoutes = [
  {
    name: CollectiblesModalRoutes.CollectionModal,
    component: CollectionModalView,
  },
  {
    name: CollectiblesModalRoutes.NFTDetailModal,
    component: NFTDetailView,
  },
];

const CollectibleModalStack = () => {
  const isVerticalLayout = useIsVerticalLayout();
  return (
    <CollectibleNavigator.Navigator
      screenOptions={(navInfo) => ({
        headerShown: false,
        ...buildModalStackNavigatorOptions({ isVerticalLayout, navInfo }),
      })}
    >
      {modalRoutes.map((route) => (
        <CollectibleNavigator.Screen
          key={route.name}
          name={route.name}
          component={route.component}
        />
      ))}
    </CollectibleNavigator.Navigator>
  );
};

export default CollectibleModalStack;
