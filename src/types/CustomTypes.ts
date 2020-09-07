
export type TableCellType = "ColumnHeader" | "RowHeader" | "Value" | "RowTotal" | "ColumnTotal" | "ExportButton";

export interface AxisKeyData {
    idValue: string;
    labelValue: string;
}

export interface TableCellData {
    keyValueX: string;
    keyValueY: string;
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
    keyValueX: string;
    keyValueY: string;
    values: ModelCellValue[];
}

export interface ModelData {
    valueMap: Map<string, ModelCellData>;
}
