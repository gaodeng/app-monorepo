import React, { useCallback } from 'react';

import { useNavigation } from '@react-navigation/core';
import { useIntl } from 'react-intl';

import {
  Box,
  Divider,
  Icon,
  Pressable,
  Switch,
  Text,
  useIsVerticalLayout,
  useTheme,
} from '@onekeyhq/components';
import {
  ModalRoutes,
  ModalScreenProps,
  RootRoutes,
} from '@onekeyhq/kit/src/routes/types';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import backgroundApiProxy from '../../../background/instance/backgroundApiProxy';
import { useAppSelector } from '../../../hooks';
import { gotoScanQrcode } from '../../../utils/gotoScanQrcode';
import {
  ManageConnectedSitesRoutes,
  ManageConnectedSitesRoutesParams,
} from '../../ManageConnectedSites/types';

import { showEnableExtTipsSheet } from './enableExtSheet';

type NavigationProps = ModalScreenProps<ManageConnectedSitesRoutesParams>;

export const UtilSection = () => {
  const intl = useIntl();
  const small = useIsVerticalLayout();
  const { themeVariant } = useTheme();
  const navigation = useNavigation<NavigationProps['navigation']>();
  const isPasswordSet = useAppSelector((s) => s.data.isPasswordSet);
  const disableExt = useAppSelector((s) => s.settings.disableExt);
  const disableExtSwitchTips = useAppSelector(
    (s) => s.settings.disableExtSwitchTips,
  );
  const onLock = useCallback(() => {
    backgroundApiProxy.serviceApp.lock(true);
  }, []);
  return (
    <Box w="full" mb="6">
      <Box
        borderRadius="12"
        bg="surface-default"
        borderWidth={themeVariant === 'light' ? 1 : undefined}
        borderColor="border-subdued"
      >
        {platformEnv.isExtension ? (
          <Pressable
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            py={4}
            px={{ base: 4, md: 6 }}
            borderBottomWidth="1"
            borderBottomColor="divider"
          >
            <Icon name="OnekeyLiteOutline" />
            <Text
              typography={{ sm: 'Body1Strong', md: 'Body2Strong' }}
              flex="1"
              numberOfLines={1}
              mx={3}
            >
              {intl.formatMessage({ id: 'form__enable_onekey' })}
            </Text>
            <Box>
              <Switch
                labelType="false"
                isChecked={!disableExt}
                onToggle={() => {
                  backgroundApiProxy.serviceSetting.toggleDisableExt();
                  if (!disableExtSwitchTips)
                    showEnableExtTipsSheet({ enable: disableExt });
                }}
              />
            </Box>
          </Pressable>
        ) : null}
        {isPasswordSet ? (
          <Pressable
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            py={4}
            px={{ base: 4, md: 6 }}
            onPress={onLock}
          >
            <Icon name="LockOutline" />
            <Text
              typography={{ sm: 'Body1Strong', md: 'Body2Strong' }}
              flex="1"
              numberOfLines={1}
              mx={3}
            >
              {intl.formatMessage({
                id: 'action__lock_now',
              })}
            </Text>
            <Box>
              <Icon name="ChevronRightSolid" size={20} />
            </Box>
          </Pressable>
        ) : null}
        {platformEnv.isExtensionUiPopup ? (
          <>
            <Divider />
            <Pressable
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              py={4}
              px={{ base: 4, md: 6 }}
              onPress={() => {
                backgroundApiProxy.serviceApp.openExtensionExpandTab({
                  routes: '',
                });
              }}
            >
              <Icon name="ArrowsExpandOutline" />
              <Text
                typography={{ sm: 'Body1Strong', md: 'Body2Strong' }}
                flex="1"
                numberOfLines={1}
                mx={3}
              >
                {intl.formatMessage({
                  id: 'form__expand_view',
                })}
              </Text>
              <Box>
                <Icon name="ChevronRightSolid" size={20} />
              </Box>
            </Pressable>
          </>
        ) : null}
        <Divider />
        <Pressable
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          py={4}
          px={{ base: 4, md: 6 }}
          onPress={() => {
            gotoScanQrcode();
          }}
        >
          <Icon name={small ? 'ScanOutline' : 'ScanSolid'} />
          <Text
            typography={{ sm: 'Body1Strong', md: 'Body2Strong' }}
            flex="1"
            numberOfLines={1}
            mx={3}
          >
            {intl.formatMessage({
              id: 'title__scan_qr_code',
            })}
          </Text>
          <Box>
            <Icon name="ChevronRightSolid" size={20} />
          </Box>
        </Pressable>
        <>
          <Divider />
          <Pressable
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            py={4}
            px={{ base: 4, md: 6 }}
            onPress={() => {
              navigation.navigate(RootRoutes.Modal, {
                screen: ModalRoutes.ManageConnectedSites,
                params: {
                  screen: ManageConnectedSitesRoutes.ManageConnectedSitesModel,
                },
              });
            }}
          >
            <Icon name="ConnectOutline" />
            <Text
              typography={{ sm: 'Body1Strong', md: 'Body2Strong' }}
              flex="1"
              numberOfLines={1}
              mx={3}
            >
              {intl.formatMessage({
                id: 'action__connected_sites',
                defaultMessage: 'Connected Sites',
              })}
            </Text>
            <Box>
              <Icon name="ChevronRightSolid" size={20} />
            </Box>
          </Pressable>
        </>
      </Box>
    </Box>
  );
};
