import { Injectable, inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  NavigationEnd,
  Router,
  UrlSerializer,
} from "@angular/router";
import { filter, firstValueFrom } from "rxjs";

import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import {
  GlobalStateProvider,
  KeyDefinition,
  POPUP_VIEW_MEMORY,
} from "@bitwarden/common/platform/state";

const POPUP_HISTORY_KEY = new KeyDefinition<string[]>(POPUP_VIEW_MEMORY, "route-history", {
  deserializer: (obj) => obj,
});

// TODO: look into 2fa auth persitence, deeplinkguard
@Injectable({
  providedIn: "root",
})
export class PopupHistoryService {
  private router = inject(Router);
  private state = inject(GlobalStateProvider).get(POPUP_HISTORY_KEY);

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const state: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;

        let child = state.firstChild;
        while (child.firstChild) {
          child = child.firstChild;
        }

        const updateUrl = !child?.data?.doNotSaveUrl ?? true;

        if (updateUrl) {
          void this.push(event.url);
        }
      });
  }

  async getHistory(): Promise<string[]> {
    return firstValueFrom(this.state.state$);
  }

  /** Get the last item in the history stack */
  async last(): Promise<string> {
    const history = await this.getHistory();
    if (!history || history.length === 0) {
      return null;
    }
    return history[history.length - 1];
  }

  /**
   * Push new URL onto history stack
   */
  async push(url: string): Promise<boolean> {
    if (url === (await this.last())) {
      return false;
    }
    await this.state.update((prevState) => (prevState === null ? [url] : prevState.concat(url)));
    return true;
  }

  /**
   * Navigate back to the prior URL in the history stack
   */
  async back(): Promise<boolean> {
    const length = (await this.getHistory())?.length;
    if (!length) {
      return false;
    }

    const newState = await this.state.update((prevState) => {
      return prevState.slice(0, -1);
    });

    return this.router.navigateByUrl(newState[newState.length - 1]);
  }
}

/** Redirect to the last visited route. Should be applied to root route. */
export const resumePopupGuard = (): CanActivateFn => {
  return async () => {
    const configService = inject(ConfigService);
    const popupHistoryService = inject(PopupHistoryService);
    const urlSerializer = inject(UrlSerializer);

    if (!(await configService.getFeatureFlag(FeatureFlag.ExtensionRefresh))) {
      return true;
    }

    const url = await popupHistoryService.last();

    if (!url) {
      return true;
    }

    return urlSerializer.parse(url);
  };
};
