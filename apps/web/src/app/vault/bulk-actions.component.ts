import { Component, Input, ViewChild, ViewContainerRef } from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PasswordRepromptService } from "@bitwarden/common/abstractions/passwordReprompt.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CipherRepromptType } from "@bitwarden/common/enums/cipherRepromptType";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { DialogService } from "@bitwarden/components";
import { lastValueFrom } from "rxjs";

import {
  BulkDeleteDialogComponent,
  BulkDeleteDialogParams,
  BulkDeleteDialogResult,
} from "./bulk-delete-dialog.component";
import { BulkMoveComponent } from "./bulk-move.component";
import { BulkRestoreComponent } from "./bulk-restore.component";
import { BulkShareComponent } from "./bulk-share.component";
import { CiphersComponent } from "./ciphers.component";

@Component({
  selector: "app-vault-bulk-actions",
  templateUrl: "bulk-actions.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class BulkActionsComponent {
  @Input() ciphersComponent: CiphersComponent;
  @Input() deleted: boolean;
  @Input() organization: Organization;

  @ViewChild("bulkDeleteTemplate", { read: ViewContainerRef, static: true })
  bulkDeleteModalRef: ViewContainerRef;
  @ViewChild("bulkRestoreTemplate", { read: ViewContainerRef, static: true })
  bulkRestoreModalRef: ViewContainerRef;
  @ViewChild("bulkMoveTemplate", { read: ViewContainerRef, static: true })
  bulkMoveModalRef: ViewContainerRef;
  @ViewChild("bulkShareTemplate", { read: ViewContainerRef, static: true })
  bulkShareModalRef: ViewContainerRef;

  constructor(
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private dialogService: DialogService,
    private modalService: ModalService,
    private passwordRepromptService: PasswordRepromptService
  ) {}

  async bulkDelete() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedIds = this.ciphersComponent.selectedCipherIds;
    if (selectedIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const bulkDeleteParams: BulkDeleteDialogParams = {
      permanent: this.deleted,
      cipherIds: selectedIds,
      organization: this.organization,
    };

    const dialog = this.dialogService.open(BulkDeleteDialogComponent, {
      data: bulkDeleteParams,
    });

    const result = (await lastValueFrom(dialog.closed)) as BulkDeleteDialogResult | undefined;
    if (result === BulkDeleteDialogResult.Deleted) {
      await this.ciphersComponent.refresh();
    }
  }

  async bulkRestore() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedIds = this.ciphersComponent.selectedCipherIds;
    if (selectedIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const [modal] = await this.modalService.openViewRef(
      BulkRestoreComponent,
      this.bulkRestoreModalRef,
      (comp) => {
        comp.cipherIds = selectedIds;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onRestored.subscribe(async () => {
          modal.close();
          await this.ciphersComponent.refresh();
        });
      }
    );
  }

  async bulkShare() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedCiphers = this.ciphersComponent.selectedCiphers;
    if (selectedCiphers.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const [modal] = await this.modalService.openViewRef(
      BulkShareComponent,
      this.bulkShareModalRef,
      (comp) => {
        comp.ciphers = selectedCiphers;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onShared.subscribe(async () => {
          modal.close();
          await this.ciphersComponent.refresh();
        });
      }
    );
  }

  async bulkMove() {
    if (!(await this.promptPassword())) {
      return;
    }

    const selectedIds = this.ciphersComponent.selectedCipherIds;
    if (selectedIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("nothingSelected")
      );
      return;
    }

    const [modal] = await this.modalService.openViewRef(
      BulkMoveComponent,
      this.bulkMoveModalRef,
      (comp) => {
        comp.cipherIds = selectedIds;
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
        comp.onMoved.subscribe(async () => {
          modal.close();
          await this.ciphersComponent.refresh();
        });
      }
    );
  }

  selectAll(select: boolean) {
    this.ciphersComponent.checkAll(select);
  }

  private async promptPassword() {
    const selectedCiphers = this.ciphersComponent.selectedCiphers;
    const notProtected = !selectedCiphers.find(
      (cipher) => cipher.reprompt !== CipherRepromptType.None
    );

    return notProtected || (await this.passwordRepromptService.showPasswordPrompt());
  }
}
