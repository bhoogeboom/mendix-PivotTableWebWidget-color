
export type TableCellType = "ColumnHeader" | "RowHeader" | "Value" | "RowTotal" | "ColumnTotal" | "ExportButton";

export interface AxisKeyData {
    idValue: string;
    labelValue: string;
}

export interface TableCellData {
    idValueX: string;
    idValueY: string;
    cellValue: string;
    cellType: TableCellType;
    classes: string;
}

export interface TableRowData {
    cells: TableCellData[];
}

export interface TableData {
    rows: TableRowData[];
}

export type ModelCellValue = string | Number;

export interface ModelCellData {
    idValueX: string;
    idValueY: string;
    values: ModelCellValue[];
}

export interface ModelData {
    valueMap: Map<string, ModelCellData>;
}

export interface InputRow {
    idValueX: string;
    labelValueX: string;
    idValueY: string;
    labelValueY: string;
    value: string | Number;
}