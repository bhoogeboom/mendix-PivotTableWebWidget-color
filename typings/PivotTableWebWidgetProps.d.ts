/**
 * This file was generated from PivotTableWebWidget.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue, ListValue, ListAttributeValue } from "mendix";

export type DataSourceTypeEnum = "datasource" | "serviceCall";

export type XIdDataTypeEnum = "string" | "integer";

export type YIdDataTypeEnum = "string" | "integer";

export type ValueDataTypeEnum = "string" | "number" | "date";

export interface ServiceParmListType {
    parameterName: DynamicValue<string>;
    parameterValue: DynamicValue<string>;
}

export type CellValueActionEnum = "count" | "sum" | "average" | "min" | "max" | "display";

export type XSortAttrEnum = "label" | "id";

export type XSortDirectionEnum = "asc" | "desc";

export type YSortAttrEnum = "label" | "id";

export type YSortDirectionEnum = "asc" | "desc";

export interface ServiceParmListPreviewType {
    parameterName: string;
    parameterValue: string;
}

export interface PivotTableWebWidgetContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex: number;
    dataSourceType: DataSourceTypeEnum;
    dataChangeDateAttr: EditableValue<Date>;
    ds?: ListValue;
    cellValueAttr?: ListAttributeValue<BigJs.Big | Date | string>;
    xIdAttr?: ListAttributeValue<BigJs.Big | string>;
    xLabelAttr?: ListAttributeValue<BigJs.Big | string>;
    yIdAttr?: ListAttributeValue<BigJs.Big | Date | string>;
    yLabelAttr?: ListAttributeValue<BigJs.Big | string>;
    xIdDataType: XIdDataTypeEnum;
    yIdDataType: YIdDataTypeEnum;
    valueDataType: ValueDataTypeEnum;
    serviceUrl?: DynamicValue<string>;
    serviceParmAttr?: EditableValue<BigJs.Big | string>;
    serviceParmList: ServiceParmListType[];
    cellValueAction: CellValueActionEnum;
    precisionForAverage: number;
    precisionForNumbers: number;
    cellValueDateformat: string;
    showTotalColumn: boolean;
    totalColumnLabel?: DynamicValue<string>;
    showTotalRow: boolean;
    totalRowLabel?: DynamicValue<string>;
    noDataText: DynamicValue<string>;
    useDisplayValueForCss: boolean;
    xSortAttr: XSortAttrEnum;
    xSortDirection: XSortDirectionEnum;
    ySortAttr: YSortAttrEnum;
    ySortDirection: YSortDirectionEnum;
    onClickAction?: ActionValue;
    onCellClickXIdAttr?: EditableValue<BigJs.Big | string>;
    onCellClickYIdAttr?: EditableValue<BigJs.Big | string>;
    logToConsole: boolean;
    dumpServiceResponseInConsole: boolean;
}

export interface PivotTableWebWidgetPreviewProps {
    class: string;
    style: string;
    dataSourceType: DataSourceTypeEnum;
    dataChangeDateAttr: string;
    ds: {} | null;
    cellValueAttr: string;
    xIdAttr: string;
    xLabelAttr: string;
    yIdAttr: string;
    yLabelAttr: string;
    xIdDataType: XIdDataTypeEnum;
    yIdDataType: YIdDataTypeEnum;
    valueDataType: ValueDataTypeEnum;
    serviceUrl: string;
    serviceParmAttr: string;
    serviceParmList: ServiceParmListPreviewType[];
    cellValueAction: CellValueActionEnum;
    precisionForAverage: number | null;
    precisionForNumbers: number | null;
    cellValueDateformat: string;
    showTotalColumn: boolean;
    totalColumnLabel: string;
    showTotalRow: boolean;
    totalRowLabel: string;
    noDataText: string;
    useDisplayValueForCss: boolean;
    xSortAttr: XSortAttrEnum;
    xSortDirection: XSortDirectionEnum;
    ySortAttr: YSortAttrEnum;
    ySortDirection: YSortDirectionEnum;
    onClickAction: {} | null;
    onCellClickXIdAttr: string;
    onCellClickYIdAttr: string;
    logToConsole: boolean;
    dumpServiceResponseInConsole: boolean;
}
