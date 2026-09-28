/**
 * EntryAbility.ets
 * Native HarmonyOS Stage Model UIAbility Lifecycle Controller
 */

import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    console.info('[SmartReplyAbility] Ability onCreate initialized.');
  }

  onDestroy(): void {
    console.info('[SmartReplyAbility] Ability onDestroy.');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    console.info('[SmartReplyAbility] Window stage created. Loading Index page...');

    // Load native ArkUI dashboard
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        console.error(`[SmartReplyAbility] Failed to load content. Cause: ${JSON.stringify(err)}`);
        return;
      }
      console.info('[SmartReplyAbility] Succeeded in loading Index page.');
    });
  }

  onWindowStageDestroy(): void {
    console.info('[SmartReplyAbility] Window stage destroyed.');
  }

  onForeground(): void {
    console.info('[SmartReplyAbility] Ability brought to foreground.');
  }

  onBackground(): void {
    console.info('[SmartReplyAbility] Ability suspended to background.');
  }
}
