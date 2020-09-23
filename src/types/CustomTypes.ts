export type TableCellType = "ColumnHeader" | "RowHeader" | "Value" | "RowTotal" | "ColumnTotal" | "RowColumnTotal" | "ExportButton" | "EmptyTopLeft" | "Empty";

export type AxisSortType = "string" | "number" | undefined;

export type ValueDataType = "string" | "number" | "date";

export type AxisMap = Map<ModelCellValue, AxisKeyData>;

export interface TableCellData {
    cellType: TableCellType;
    idValueX?: string;
    idValueY?: string;
    cellValue?: string;
    classes?: string;
}

export interface TableRowData {
    cells: TableCellData[];
}

export interface TableData {
    headerRow: TableRowData;
    bodyRows: TableRowData[];
    footerRow?: TableRowData;
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
    aggregatedValue: number;
}

export interface ModelData {
    valueMap: Map<string, ModelCellData>;
    xAxisMap: AxisMap;
    yAxisMap: AxisMap;
    xAxisArray: AxisKeyData[];
    yAxisArray: AxisKeyData[];
    tableData: TableData;
    errorArray?: ErrorArray;
}

export interface InputRow {
    idValueX: string;
    labelValueX: string;
    idValueY: string;
    labelValueY: string;
    value: string | number;
}

export type ErrorArray = string[];
