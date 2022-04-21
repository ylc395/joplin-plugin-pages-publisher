import { SettingItemType } from 'api/types';

export const UI_TYPE_SETTING = 'uiType';
export const UI_SIZE_SETTING = 'uiSize';
export const DEFAULT_UI_SIZE = '600*640';
export const IS_NEW_USER_SETTING = 'isNewUser';
export enum UIType {
  Dialog,
  Panel,
}
export const SECTION_NAME = 'Pages Publisher';

export const SETTINGS = {
  githubToken: {
    label: 'Github Token',
    secure: true,
    type: SettingItemType.String,
    public: true,
    value: '',
    section: SECTION_NAME,
    description:
      '"public_repo" scope is required. See https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token for details',
  },
  [UI_TYPE_SETTING]: {
    label: 'UI Type',
    type: SettingItemType.Int,
    public: true,
    value: UIType.Panel,
    isEnum: true,
    options: {
      [UIType.Dialog]: 'Dialog',
      [UIType.Panel]: 'Panel',
    },
    section: SECTION_NAME,
    description:
      "Use Dialog or Panel to display this plugin's UI(need to restart Joplin to take effect).",
  },
  [UI_SIZE_SETTING]: {
    label: 'UI Size',
    type: SettingItemType.String,
    public: true,
    value: DEFAULT_UI_SIZE,
    section: SECTION_NAME,
    description: 'Size for UI in the dialog. width*height',
  },
  [IS_NEW_USER_SETTING]: {
    public: false,
    value: true,
    type: SettingItemType.Bool,
    label: IS_NEW_USER_SETTING,
  },
};
