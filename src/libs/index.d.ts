type TSettingItemType = "checkbox" | "select" | "textinput" | "textarea" | "slider" | "button";
interface ISettingItem {
    key: string;
    value: any;
    type: TSettingItemType;
    title: string;
    description?: string;
    slider?: {
        min: number;
        max: number;
        step: number;
    };
    select?: {
        options: {val: any; text: string}[];
    };
    button?: {
        label: string;
        callback: () => void;
    }
}
