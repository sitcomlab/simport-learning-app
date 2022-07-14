export enum SettingsConfig {
  hasConsent = 'hasConsent',
  isFirstConsent = 'isFirstConsent',
  isFirstAppStart = 'isFirstAppStart',
  useAlternativeAppMode = 'useAlternativeAppMode',
}

export class SettingsConfigUtil {
  public static defaultValue(config: SettingsConfig) {
    switch (config) {
      case SettingsConfig.hasConsent:
        return false
      case SettingsConfig.isFirstConsent:
        return true
      case SettingsConfig.isFirstAppStart:
        return true
      case SettingsConfig.useAlternativeAppMode:
        return false
    }
  }
}
