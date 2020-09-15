export type TableCellType = "ColumnHeader" | "RowHeader" | "Value" | "RowTotal" | "ColumnTotal" | "ExportButton";

export type AxisSortType = "string" | "number" | undefined;

export type AxisMap = Map<ModelCellValue, AxisKeyData>;

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

export type ModelCellValue = string | number;

export interface AxisKeyData {
    idValue: ModelCellValue;
    labelValue: string;
}

export interface ModelCellData {
    idValueX: ModelCellValue;
    idValueY: ModelCellValue;
    values: ModelCellValue[];
}

export interface ModelData {
    valueMap: Map<string, ModelCellData>;
    xAxisMap: AxisMap;
    yAxisMap: AxisMap;
    xAxisArray?: AxisKeyData[];
    yAxisArray?: AxisKeyData[];
}

export interface InputRow {
    idValueX: string;
    labelValueX: string;
    idValueY: string;
    labelValueY: string;
    value: string | number;
}

export type ErrorArray = string[];
