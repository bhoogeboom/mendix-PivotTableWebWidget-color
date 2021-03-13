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
    classValue: string;
}

export interface ModelCellData {
    idValueX: ModelCellValue;
    idValueY: ModelCellValue;
    values: ModelCellValue[];
    aggregatedValue: number;
}

export interface ConditionalStylingItem {
    value: number;
    className: string;
}

export type ConditionalStylingArray = ConditionalStylingItem[];

export type ErrorArray = string[];

export interface ModelData {
    valueMap: Map<string, ModelCellData>;
    xAxisMap: AxisMap;
    yAxisMap: AxisMap;
    xAxisArray: AxisKeyData[];
    yAxisArray: AxisKeyData[];
    tableData: TableData;
    conditionalStylingArray?: ConditionalStylingArray;
    errorArray?: ErrorArray;
}

export interface InputRow {
    idValueX: string;
    labelValueX: string;
    classValueX: string;
    idValueY: string;
    labelValueY: string;
    classValueY: string;
    value: string | number;
}
