import React, { useCallback } from 'react';

import { useNavigation, useQuote, useSwap } from '../../../hooks';
import TokenSelector from '../components/TokenSelector';

import type { ValuedToken } from '../../../store/typings';

const Output = () => {
  const navigation = useNavigation();
  const { setOut, input } = useSwap();
  const { refresh } = useQuote();
  const onPress = useCallback(
    (token: ValuedToken) => {
      setOut(token);
      refresh();
      navigation.goBack();
    },
    [navigation, refresh, setOut],
  );
  return <TokenSelector onPress={onPress} excluded={input} />;
};

export default Output;
