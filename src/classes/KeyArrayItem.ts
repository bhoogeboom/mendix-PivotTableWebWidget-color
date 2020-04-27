export class KeyArrayItem {
    private _idValue: string;
    private _labelValue: string;

    constructor(idValue: string, labelValue: string) {
        this._idValue = idValue;
        this._labelValue = labelValue;
    }
    
    public get idValue() : string {
        return this._idValue;
    }
    public set idValue(v : string) {
        this._idValue = v;
    }

    public get labelValue() : string {
        return this._labelValue;
    }
    
    public set labelValue(v : string) {
        this._labelValue = v;
    }
    
}