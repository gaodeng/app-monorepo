import { IVaultSettings } from '../../types';

const settings: IVaultSettings = {
  feeInfoEditable: false,
  privateKeyExportEnabled: true,
  tokenEnabled: true,
  txCanBeReplaced: false,

  importedAccountEnabled: true,
  hardwareAccountEnabled: true,
  externalAccountEnabled: false,
  watchingAccountEnabled: true,

  isUTXOModel: false,

  cannotSendToSelf: true,
};

export default settings;
