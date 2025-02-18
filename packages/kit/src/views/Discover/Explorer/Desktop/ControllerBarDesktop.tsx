import {
  ComponentProps,
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useIntl } from 'react-intl';
import { TextInput } from 'react-native';

import {
  HStack,
  ICON_NAMES,
  IconButton,
  Input,
  Pressable,
} from '@onekeyhq/components';

import backgroundApiProxy from '../../../../background/instance/backgroundApiProxy';
import { NetworkAccountSelectorTrigger } from '../../../../components/NetworkAccountSelector';
import { homeTab } from '../../../../store/reducers/webTabs';
import { gotoSite, openMatchDApp } from '../Controller/gotoSite';
import { useWebController } from '../Controller/useWebController';
import {
  MatchDAppItemType,
  SearchViewKeyEventType,
  SearchViewRef,
} from '../explorerUtils';
import SearchView from '../Search/SearchView';

type BrowserURLInputProps = {
  onClear?: () => void;
  onChangeText?: (text: string) => void;
  customLeftIcon?: ICON_NAMES;
} & Omit<ComponentProps<typeof Input>, 'onChange' | 'onChangeText'>;

const BrowserURLInput = forwardRef<TextInput, BrowserURLInputProps>(
  // eslint-disable-next-line react/prop-types
  ({ value, onClear, onChangeText, customLeftIcon, ...props }, ref) => {
    const [innerValue, setInnerValue] = useState(value);
    const handleChangeText = useCallback(
      (text: string) => {
        if (typeof value === 'undefined') {
          setInnerValue(text);
        } else if (typeof onChangeText !== 'undefined') {
          onChangeText(text);
        }
      },
      [value, onChangeText],
    );

    return (
      <Input
        // @ts-expect-error
        ref={ref}
        value={value ?? innerValue}
        leftIconName={customLeftIcon ?? 'SearchOutline'}
        // rightIconName={rightIconName}
        placeholder="Search..."
        autoCorrect={false}
        autoCapitalize="none"
        onPressRightIcon={onClear}
        onChangeText={handleChangeText}
        {...props}
      />
    );
  },
);

BrowserURLInput.displayName = 'BrowserURLInput';

function getHttpSafeState(searchContent?: string): ICON_NAMES {
  try {
    if (!searchContent) {
      return 'SearchCircleSolid';
    }

    const url = new URL(searchContent);
    if (url.protocol === 'https:') {
      return 'LockClosedSolid';
    }
    if (url.protocol === 'http:') {
      return 'ExclamationCircleSolid';
    }
  } catch (e) {
    return 'SearchCircleSolid';
  }
  return 'SearchCircleSolid';
}
const ControllerBarDesktop: FC = () => {
  const intl = useIntl();
  const [historyVisible, setHistoryVisible] = useState(false);
  const { currentTab, stopLoading, goBack, goForward, reload } =
    useWebController();
  const { loading, canGoBack, canGoForward } = currentTab;

  const onSearchSubmitEditing = (dapp: MatchDAppItemType | string) => {
    if (typeof dapp === 'string') {
      return gotoSite({ url: dapp });
    }
    openMatchDApp(dapp);
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const url: string = currentTab?.url || '';
  const [searchText, setSearchText] = useState(url);
  const httpSafeState = getHttpSafeState(url);

  useEffect(() => {
    setSearchText(url);
  }, [url]);

  const searchBar = useRef<TextInput>(null);
  // Todo Ref Type
  const searchView = useRef<SearchViewRef>(null);

  const onKeyEvent = (event: SearchViewKeyEventType) =>
    searchView.current?.onKeyPress(event);
  return (
    <>
      <HStack
        bg="background-default"
        w="100%"
        h="48px"
        px={8}
        space={3}
        alignItems="center"
      >
        <IconButton
          type="plain"
          name="ArrowLeftOutline"
          disabled={!canGoBack}
          isDisabled={!canGoBack}
          onPress={goBack}
        />
        <IconButton
          type="plain"
          name="ArrowRightOutline"
          disabled={!canGoForward}
          isDisabled={!canGoForward}
          onPress={goForward}
        />
        <IconButton
          type="plain"
          name={loading ? 'CloseOutline' : 'RefreshOutline'}
          onPress={loading ? stopLoading : reload}
        />

        <Pressable
          flex={1}
          style={{
            // @ts-expect-error
            WebkitAppRegion: 'no-drag',
          }}
        >
          <BrowserURLInput
            ref={searchBar}
            w="100%"
            h="32px"
            placeholder={intl.formatMessage({
              id: 'content__search_or_enter_dapp_url',
            })}
            customLeftIcon={httpSafeState}
            size="base"
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            value={searchText}
            onClear={() => setSearchText('')}
            onChangeText={setSearchText}
            // @ts-ignore
            onSubmitEditing={({ nativeEvent: { text } }) => {
              const trimText = text.trim();
              if (trimText) {
                setSearchText(trimText);
                onSearchSubmitEditing(trimText);
              }
            }}
            // @ts-ignore
            onKeyPress={(event) => {
              const { key } = event.nativeEvent;
              if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Enter') {
                if (onKeyEvent?.(key)) {
                  // 阻断 上键、下键 事件传递
                  event.preventDefault();
                }
              }
            }}
            selectTextOnFocus
            onFocus={() => {
              setHistoryVisible(true);
            }}
            onBlur={() => {
              if (searchText?.trim() === '') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                setSearchText(url);
              }
              setHistoryVisible(false);
            }}
            rightElement={
              currentTab?.id !== homeTab.id ? (
                <IconButton
                  onPress={() =>
                    currentTab &&
                    backgroundApiProxy.serviceDiscover.toggleBookmark(
                      currentTab,
                    )
                  }
                  type="plain"
                  name="StarSolid"
                  iconColor={
                    currentTab?.isBookmarked ? 'icon-warning' : 'icon-default'
                  }
                />
              ) : undefined
            }
          />
        </Pressable>

        <NetworkAccountSelectorTrigger size="lg" />
      </HStack>
      <SearchView
        ref={searchView}
        visible={historyVisible}
        onSearchContentChange={setSearchText}
        searchContent={searchText}
        onSelectorItem={(item: MatchDAppItemType) => {
          onSearchSubmitEditing(item);
          searchBar.current?.blur();
        }}
        relativeComponent={searchBar.current}
      />
    </>
  );
};
ControllerBarDesktop.displayName = 'ControllerBarDesktop';

export default ControllerBarDesktop;
