import { Autowired } from "../context/context";
import { GridOptionsWrapper } from "../gridOptionsWrapper";
import { AgEvent } from "../events";
import { AgInputField } from "./agInputField";
import { LabelAlignment } from "./agLabel";
import { _ } from "../utils";

export interface ChangeEvent extends AgEvent {
    selected: boolean;
}

export class AgCheckbox extends AgInputField {

    protected className = 'ag-checkbox';
    protected inputTag = 'input';
    protected inputType = 'checkbox';
    protected labelAlignment: LabelAlignment = 'right';
    protected labelSeparator = '';
    protected iconMap: { selected: string, unselected: string, indeterminate?: string } = {
        selected: 'checkboxChecked',
        unselected: 'checkboxUnchecked',
        indeterminate: 'checkboxIndeterminate'
    };

    public static EVENT_CHANGED = 'change';

    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;

    private selected: boolean | undefined = false;
    private readOnly = false;
    private passive = false;
    protected eIconEl: HTMLElement;

    constructor() {
        super();
        this.setTemplate(this.TEMPLATE.replace(/%input%/, this.inputTag));
    }

    protected postConstruct(): void {
        super.postConstruct();
        _.addCssClass(this.eInput, 'ag-hidden');
        this.addIconsPlaceholder();
        this.updateIcons();
        this.addDestroyableEventListener(this.getGui(), 'click', (e) => this.onClick(e));
    }

    private addIconsPlaceholder(): void {
        const iconDiv = document.createElement('div');
        this.eInputWrapper.appendChild(iconDiv);
        this.eIconEl = iconDiv;
    }

    private onClick(event: MouseEvent): void {
        // if we don't set the path, then won't work in Edge, as once the <span> is removed from the dom,
        // it's not possible to calculate the path by following the parent's chain. in other browser (eg
        // chrome) there is event.path for this purpose, but missing in Edge.
        _.addAgGridEventPath(event);

        if (!this.readOnly) {
            this.toggle();
        }
    }

    public getNextValue(): boolean {
        return this.selected === undefined ? true : !this.selected;
    }

    public setPassive(passive: boolean): void {
        this.passive = passive;
    }

    public setReadOnly(readOnly: boolean): void {
        this.readOnly = readOnly;
        this.updateIcons();
    }

    public isReadOnly(): boolean {
        return this.readOnly;
    }

    protected isSelected(): boolean {
        return this.selected;
    }

    public toggle(): void {
        const nextValue = this.getNextValue();

        if (this.passive) {
            const event: ChangeEvent = {
                type: AgCheckbox.EVENT_CHANGED,
                selected: nextValue
            };
            this.dispatchEvent(event);
        } else {
            this.setValue(nextValue);
        }
    }

    protected setSelected(selected?: boolean, silent?: boolean): void {
        if (this.selected === selected) {
            return;
        }

        this.selected = typeof selected === 'boolean' ? selected :  undefined;
        (this.eInput as HTMLInputElement).checked = this.selected;

        this.updateIcons();

        if (!silent) {
            const event: ChangeEvent = {
                type: AgCheckbox.EVENT_CHANGED,
                selected: this.selected
            };
            this.dispatchEvent(event);
        }
    }

    public onSelectionChange(callbackFn: (newSelection: boolean) => void) {
        this.addDestroyableEventListener(this, 'change', () => {
            callbackFn(this.selected);
        });
        return this;
    }

    protected getIconName(): string {
        const value = this.getValue();
        const prop = value === undefined ? 'indeterminate' : (value ? 'selected' : 'unselected');
        const readOnlyStr = this.isReadOnly() ? 'ReadOnly' : '';
        return `${this.iconMap[prop]}${readOnlyStr}`;
    }

    protected updateIcons(): void {
        _.clearElement(this.eIconEl);
        this.eIconEl.appendChild(_.createIconNoSpan(this.getIconName(), this.gridOptionsWrapper, null));
    }

    public getValue(): boolean {
        return this.isSelected();
    }

    public setValue(value: boolean | undefined, silent?: boolean): this {
        this.setSelected(value, silent);

        return this;
    }
}
