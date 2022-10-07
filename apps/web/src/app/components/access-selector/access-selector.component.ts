import { Component, forwardRef, Input, OnDestroy, OnInit } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

import { FormSelectionList } from "@bitwarden/angular/utils/FormSelectionList";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";

import {
  AccessItemType,
  AccessItemValue,
  AccessItemView,
  CollectionPermission,
} from "./access-selector.models";

@Component({
  selector: "bit-access-selector",
  templateUrl: "access-selector.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AccessSelectorComponent),
      multi: true,
    },
  ],
})
export class AccessSelectorComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private notifyOnChange: (v: unknown) => void;
  private notifyOnTouch: () => void;

  /**
   * The internal selection list that tracks the value of this form control / component.
   * It's responsible for keeping items sorted and synced with the rendered form controls
   * @protected
   */
  protected selectionList = new FormSelectionList<AccessItemView, AccessItemValue>((item) => {
    return this.formBuilder.group({
      id: item.id,
      type: item.type,
      permission: new FormControl<CollectionPermission>(this.initialPermission),
    });
  }, this._itemComparator.bind(this));

  /**
   * Internal form group for this component.
   * @protected
   */
  protected formGroup = this.formBuilder.group({
    items: this.selectionList.formArray,
  });

  protected itemType = AccessItemType;
  protected permissionList = [
    { perm: CollectionPermission.VIEW, labelId: "canView" },
    { perm: CollectionPermission.VIEW_EXCEPT_PASSWORDS, labelId: "canViewExceptPass" },
    { perm: CollectionPermission.EDIT, labelId: "canEdit" },
    { perm: CollectionPermission.EDIT_EXCEPT_PASSWORDS, labelId: "canEditExceptPass" },
  ];
  protected initialPermission = CollectionPermission.VIEW;

  disabled: boolean;

  /**
   * List of all selectable items that. Sorted internally.
   */
  @Input()
  get items(): AccessItemView[] {
    return this.selectionList.allItems;
  }

  set items(val: AccessItemView[]) {
    this.selectionList.populateItems(val, this.selectionList.formArray.getRawValue() ?? []);
  }

  /**
   * Flag for if the permission form controls should be present
   */
  @Input()
  get usePermissions(): boolean {
    return this._usePermissions;
  }

  set usePermissions(value: boolean) {
    this._usePermissions = value;
    // Toggle any internal permission controls
    for (const control of this.selectionList.formArray.controls) {
      value ? control.get("permission").enable() : control.get("permission").disable();
    }
  }
  private _usePermissions: boolean;

  /**
   * Column header for the selected items table
   */
  @Input() columnHeader: string;

  /**
   * Label used for the ng selector
   */
  @Input() selectorLabelText: string;

  /**
   * Helper text displayed under the ng selector
   */
  @Input() selectorHelpText: string;

  /**
   * Text that is shown in the table when no items are selected
   */
  @Input() emptySelectionText: string;

  /**
   * Flag for if the member roles column should be present
   */
  @Input() showMemberRoles: boolean;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly i18nService: I18nService
  ) {}

  /** Required for NG_VALUE_ACCESSOR */
  registerOnChange(fn: any): void {
    this.notifyOnChange = fn;
  }

  /** Required for NG_VALUE_ACCESSOR */
  registerOnTouched(fn: any): void {
    this.notifyOnTouch = fn;
  }

  /** Required for NG_VALUE_ACCESSOR */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;

    // Keep the internal FormGroup in sync
    if (this.disabled) {
      this.formGroup.disable();
    } else {
      this.formGroup.enable();
    }
  }

  /** Required for NG_VALUE_ACCESSOR */
  writeValue(selectedItems: AccessItemValue[]): void {
    // Always clear the internal selection list on a new value
    this.selectionList.deselectAll();

    // If the new value is null, then we're done
    if (selectedItems == null) {
      return;
    }

    // Unable to handle other value types, throw
    if (!Array.isArray(selectedItems)) {
      throw new Error("The access selector component only supports Array form values!");
    }

    // Iterate and internally select each item
    for (const value of selectedItems) {
      this.selectionList.selectItem(value.id, value);
    }
  }

  protected handleOnTouch() {
    if (!this.notifyOnTouch) {
      return;
    }

    this.notifyOnTouch();
  }

  ngOnInit() {
    // Watch the internal formArray for changes and propagate them
    this.selectionList.formArray.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
      if (!this.notifyOnChange) {
        return;
      }
      this.notifyOnChange(v);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectItem(event: Event) {
    const target = event.target as HTMLSelectElement;
    const addedId = target.value;
    this.selectionList.selectItem(addedId);
    target.value = "";
  }

  itemIcon(item: AccessItemView) {
    switch (item.type) {
      case AccessItemType.COLLECTION:
        return "bwi-collection";
      case AccessItemType.GROUP:
        return "bwi-users";
      case AccessItemType.MEMBER:
        return "bwi-user";
    }
  }

  private _itemComparator(a: AccessItemView, b: AccessItemView) {
    if (a.type != b.type) {
      return a.type - b.type;
    }
    return this.i18nService.collator.compare(a.listName + a.labelName, b.listName + b.labelName);
  }
}
