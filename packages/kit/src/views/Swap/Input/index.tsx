import React, { useCallback } from 'react';

import { useNavigation, useQuote, useSwap } from '../../../hooks';
import TokenSelector from '../components/TokenSelector';

import type { ValuedToken } from '../../../store/typings';

const Input = () => {
  const navigation = useNavigation();
  const { setIn, output } = useSwap();
  const { refresh } = useQuote();
  const onPress = useCallback(
    (token: ValuedToken) => {
      setIn(token);
      refresh();
      navigation.goBack();
    },
    [navigation, refresh, setIn],
  );
  return <TokenSelector onPress={onPress} excluded={output} />;
};

export default Input;
