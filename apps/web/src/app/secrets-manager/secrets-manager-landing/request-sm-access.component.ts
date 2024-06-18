import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Guid } from "@bitwarden/common/types/guid";
import { NoItemsModule, SearchModule, ToastService } from "@bitwarden/components";

import { HeaderModule } from "../../layouts/header/header.module";
import { OssModule } from "../../oss.module";
import { SharedModule } from "../../shared/shared.module";
import { RequestSMAccessRequest } from "../models/requests/request-sm-access.request";

import { SmLandingApiService } from "./sm-landing-api.service";

@Component({
  selector: "app-request-sm-access",
  standalone: true,
  templateUrl: "request-sm-access.component.html",
  imports: [SharedModule, SearchModule, NoItemsModule, HeaderModule, OssModule],
})
export class RequestSMAccessComponent implements OnInit {
  requestAccessForm = new FormGroup({
    requestAccessEmailContents: new FormControl(
      this.i18nService.t("requestAccessSMDefaultEmailContent"),
      [Validators.required],
    ),
    selectedOrganization: new FormControl<Organization>(null, [Validators.required]),
  });
  organizations: Organization[] = [];

  constructor(
    private router: Router,
    private i18nService: I18nService,
    private organizationService: OrganizationService,
    private smLandingApiService: SmLandingApiService,
    private toastService: ToastService,
  ) {}

  async ngOnInit() {
    this.organizations = (await this.organizationService.getAll()).filter((e) => e.enabled);

    if (this.organizations === null || this.organizations.length < 1) {
      await this.navigateToCreateOrganizationPage();
    }
  }

  submit = async () => {
    this.requestAccessForm.markAllAsTouched();
    if (this.requestAccessForm.invalid) {
      return;
    }

    const formValue = this.requestAccessForm.value;
    const request = new RequestSMAccessRequest();
    request.OrganizationId = formValue.selectedOrganization.id as Guid;
    request.EmailContent = formValue.requestAccessEmailContents;

    await this.smLandingApiService.requestSMAccessFromAdmins(request);
    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("smAccessRequestEmailSent"),
    });
    await this.router.navigate(["/"]);
  };

  async navigateToCreateOrganizationPage() {
    await this.router.navigate(["/create-organization"]);
  }
}
