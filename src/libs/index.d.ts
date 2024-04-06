type TSettingItemType = "checkbox" | "select" | "textinput" | "textarea" | "number" | "slider" | "button" | "hint";
interface ISettingItem {
    key: string;
    value: any;
    type: TSettingItemType;
    title: string;
    description?: string;
    placeholder?: string;
    slider?: {
        min: number;
        max: number;
        step: number;
    };
    options?: { [key: string | number]: string };
    action?: {
        callback: () => void;
    }
    button?: {
        label: string;
        callback: () => void;
    }
}
