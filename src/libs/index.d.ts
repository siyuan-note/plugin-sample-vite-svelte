type TSettingItemType = "checkbox" | "select" | "textinput" | "textarea" | "slider" | "button";
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
    button?: {
        label: string;
        callback: () => void;
    }
}
