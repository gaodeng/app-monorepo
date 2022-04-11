import React, { useCallback } from 'react';

import { useIntl } from 'react-intl';

import {
  Box,
  Button,
  Center,
  Divider,
  IconButton,
  Typography,
} from '@onekeyhq/components';
import { ModalRoutes, RootRoutes } from '@onekeyhq/kit/src/routes/types';

import { useNavigation, useQuote, useSwap } from '../../hooks';

import TokenInput from './components/TokenInput';
import { SwapRoutes } from './typings';

const SwapContent = () => {
  const intl = useIntl();
  const {
    input,
    output,
    inputAmount,
    outputAmount,
    setInAmount,
    setOutAmount,
    setIndependentField,
  } = useSwap();
  const { refresh, data, isLoading } = useQuote();
  const navigation = useNavigation();
  const onInputPress = useCallback(() => {
    navigation.navigate(RootRoutes.Modal, {
      screen: ModalRoutes.Swap,
      params: {
        screen: SwapRoutes.Input,
      },
    });
  }, [navigation]);
  const onOutputPress = useCallback(() => {
    navigation.navigate(RootRoutes.Modal, {
      screen: ModalRoutes.Swap,
      params: {
        screen: SwapRoutes.Output,
      },
    });
  }, [navigation]);
  const onInputChange = useCallback(
    (value: string) => {
      setInAmount(value);
      setIndependentField('INPUT');
      setTimeout(refresh, 100);
    },
    [setInAmount, setIndependentField, refresh],
  );
  const onOutputChange = useCallback(
    (value: string) => {
      setOutAmount(value);
      setIndependentField('OUTPUT');
      setTimeout(refresh, 100);
    },
    [setOutAmount, setIndependentField, refresh],
  );

  return (
    <Center px="4">
      <Box
        bg="surface-default"
        shadow="depth.2"
        maxW="420"
        w="full"
        borderRadius={12}
        px="4"
        py="6"
      >
        <Box
          borderWidth="0.5"
          borderColor="border-default"
          bg="surface-subdued"
          borderRadius={12}
        >
          <TokenInput
            label={intl.formatMessage({ id: 'content__from' })}
            token={input}
            inputValue={inputAmount}
            onChange={onInputChange}
            onPress={onInputPress}
          />
          <Box w="full" h="10" position="relative">
            <Box position="absolute" w="full" h="full">
              <Center w="full" h="full">
                <Divider />
              </Center>
            </Box>
            <Center>
              <IconButton
                w="10"
                h="10"
                name="SwitchVerticalSolid"
                borderRadius="full"
                borderColor="border-disabled"
                borderWidth="0.5"
                bg="surface-default"
              />
            </Center>
          </Box>
          <TokenInput
            label={intl.formatMessage({ id: 'content__to' })}
            token={output}
            inputValue={outputAmount}
            onChange={onOutputChange}
            onPress={onOutputPress}
          />
        </Box>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          mt="2"
          mb="4"
        >
          <Typography.Body2 color="text-subdued">
            {intl.formatMessage({ id: 'Rate' })}
          </Typography.Body2>
          <Typography.Body2 color="text-default">
            {data && input?.symbol && output?.symbol
              ? `1${input.symbol.toUpperCase()} = ${Number(data.price).toFixed(
                  2,
                )}${output.symbol.toUpperCase()}`
              : '---'}
          </Typography.Body2>
        </Box>
        <Button type="primary" isDisabled isLoading={isLoading}>
          {intl.formatMessage({ id: 'title__swap' })}
        </Button>
      </Box>
    </Center>
  );
};

export default SwapContent;
