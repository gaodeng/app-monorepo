import React, { FC } from 'react';

import { useIntl } from 'react-intl';

import {
  Box,
  Center,
  HStack,
  Icon,
  Input,
  Pressable,
  Token,
  Typography,
} from '@onekeyhq/components';

import { ValuedToken } from '../../../../store/typings';

type TokenInputProps = {
  token?: ValuedToken;
  label?: string;
  inputValue?: string;
  onPress?: () => void;
  onChange?: (text: string) => void;
};

const TokenInput: FC<TokenInputProps> = ({
  label,
  inputValue,
  onPress,
  token,
  onChange,
}) => {
  const intl = useIntl();
  return (
    <Box h="20" px="3" py="4">
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        <Typography.Caption>{label}</Typography.Caption>
        <Typography.Caption>
          {intl.formatMessage({ id: 'content__balance_str' }, { '0': 0 })}
        </Typography.Caption>
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Input
          borderWidth={0}
          placeholder="0.00"
          pl="0"
          bg="transparent"
          _hover={{ bg: 'transparent' }}
          _focus={{ bg: 'transparent' }}
          value={inputValue}
          onChangeText={onChange}
        />
        <Pressable onPress={onPress}>
          <HStack alignItems="center">
            {token ? (
              <HStack alignItems="center" space={1}>
                <Token size="6" src={token.logoURI} />
                <Typography.Body1>{token.symbol}</Typography.Body1>
              </HStack>
            ) : (
              <Typography.Body1>
                {intl.formatMessage({ id: 'title__select_a_token' })}
              </Typography.Body1>
            )}
            <Center w="5" h="5">
              <Icon size={10} name="ChevronDownOutline" />
            </Center>
          </HStack>
        </Pressable>
      </Box>
    </Box>
  );
};

export default TokenInput;
