import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgReceiptRefund = (props: SvgProps) => (
  <Svg
    viewBox="0 0 20 20"
    fill="currentColor"
    accessibilityRole="image"
    {...props}
  >
    <Path
      fillRule="evenodd"
      d="M5 2a2 2 0 0 0-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 0 0-2-2H5zm4.707 3.707a1 1 0 0 0-1.414-1.414l-3 3a1 1 0 0 0 0 1.414l3 3a1 1 0 0 0 1.414-1.414L8.414 9H10a3 3 0 0 1 3 3v1a1 1 0 1 0 2 0v-1a5 5 0 0 0-5-5H8.414l1.293-1.293z"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgReceiptRefund;
