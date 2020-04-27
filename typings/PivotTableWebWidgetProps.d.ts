/**
 * This file was generated from PivotTableWebWidget.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { DynamicValue, EditableValue, ListValue, ObjectItem } from "mendix";

export type DataSourceTypeEnum = "datasource" | "serviceCall";

export type CellValueActionEnum = "count" | "sum" | "average" | "min" | "max" | "display";

export type XSortAttrEnum = "label" | "id";

export type XSortDirectionEnum = "asc" | "desc";

export type YSortAttrEnum = "label" | "id";

export type YSortDirectionEnum = "asc" | "desc";

export interface PivotTableWebWidgetContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex: number;
    dataSourceType: DataSourceTypeEnum;
    ds?: ListValue;
    dataChangeDateAttr: EditableValue<Date>;
    cellValueAttr?: (item: ObjectItem) => EditableValue<BigJs.Big | Date | string>;
    xIdAttr?: (item: ObjectItem) => EditableValue<BigJs.Big | Date | string>;
    xLabelAttr?: (item: ObjectItem) => EditableValue<BigJs.Big | Date | string>;
    yIdAttr?: (item: ObjectItem) => EditableValue<BigJs.Big | Date | string>;
    yLabelAttr?: (item: ObjectItem) => EditableValue<BigJs.Big | Date | string>;
    cellValueAction: CellValueActionEnum;
    precisionForAverage: number;
    precisionForDecimal: number;
    cellValueDateformat: string;
    showTotalColumn: boolean;
    totalColumnLabel?: DynamicValue<string>;
    showTotalRow: boolean;
    totalRowLabel?: DynamicValue<string>;
    noDataText: DynamicValue<string>;
    xLabelDateformat: string;
    xSortAttr: XSortAttrEnum;
    xSortDirection: XSortDirectionEnum;
    yLabelDateformat: string;
    ySortAttr: YSortAttrEnum;
    ySortDirection: YSortDirectionEnum;
}

export interface PivotTableWebWidgetPreviewProps {
    class: string;
    style: string;
    dataSourceType: DataSourceTypeEnum;
    ds: {} | null;
    dataChangeDateAttr: string;
    cellValueAttr: string;
    xIdAttr: string;
    xLabelAttr: string;
    yIdAttr: string;
    yLabelAttr: string;
    cellValueAction: CellValueActionEnum;
    precisionForAverage: number | null;
    precisionForDecimal: number | null;
    cellValueDateformat: string;
    showTotalColumn: boolean;
    totalColumnLabel: string;
    showTotalRow: boolean;
    totalRowLabel: string;
    noDataText: string;
    xLabelDateformat: string;
    xSortAttr: XSortAttrEnum;
    xSortDirection: XSortDirectionEnum;
    yLabelDateformat: string;
    ySortAttr: YSortAttrEnum;
    ySortDirection: YSortDirectionEnum;
}
