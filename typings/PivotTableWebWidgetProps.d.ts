/**
 * This file was generated from PivotTableWebWidget.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue, ListValue, ListAttributeValue } from "mendix";
import { Big } from "big.js";

export type DataSourceTypeEnum = "datasource" | "serviceCall";

export type CellValueActionEnum = "count" | "sum" | "average" | "min" | "max" | "display";

export type XIdDataTypeEnum = "string" | "integer";

export type YIdDataTypeEnum = "string" | "integer";

export type ValueDataTypeEnum = "string" | "number" | "date";

export interface ServiceParmListType {
    parameterName: DynamicValue<string>;
    parameterValue: DynamicValue<string>;
}

export interface ConditionalStylingListType {
    className?: DynamicValue<string>;
    decimalThresholdValue?: DynamicValue<Big>;
    dateThresholdValue?: DynamicValue<Date>;
}

export type XSortAttrEnum = "label" | "id";

export type XSortDirectionEnum = "asc" | "desc";

export type YSortAttrEnum = "label" | "id";

export type YSortDirectionEnum = "asc" | "desc";

export interface ServiceParmListPreviewType {
    parameterName: string;
    parameterValue: string;
}

export interface ConditionalStylingListPreviewType {
    className: string;
    decimalThresholdValue: string;
    dateThresholdValue: string;
}

export interface PivotTableWebWidgetContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    dataSourceType: DataSourceTypeEnum;
    cellValueAction: CellValueActionEnum;
    precisionForAverage: number;
    precisionForNumbers: number;
    useThousandSeparators: boolean;
    cellValueDateformat: DynamicValue<string>;
    showTotalColumn: boolean;
    totalColumnLabel?: DynamicValue<string>;
    showTotalRow: boolean;
    totalRowLabel?: DynamicValue<string>;
    noDataText: DynamicValue<string>;
    useDisplayValueForCss: boolean;
    ds?: ListValue;
    cellValueAttr?: ListAttributeValue<Big | Date | string>;
    xIdAttr?: ListAttributeValue<Big | string>;
    xLabelAttr?: ListAttributeValue<Big | string>;
    xClassAttr?: ListAttributeValue<string>;
    yIdAttr?: ListAttributeValue<Big | Date | string>;
    yLabelAttr?: ListAttributeValue<Big | string>;
    yClassAttr?: ListAttributeValue<string>;
    dataChangeDateAttr?: EditableValue<Date>;
    xIdDataType: XIdDataTypeEnum;
    yIdDataType: YIdDataTypeEnum;
    valueDataType: ValueDataTypeEnum;
    serviceUrl?: DynamicValue<string>;
    serviceParmAttr?: EditableValue<Big | string>;
    serviceParmList: ServiceParmListType[];
    conditionalStylingList: ConditionalStylingListType[];
    xSortAttr: XSortAttrEnum;
    xSortDirection: XSortDirectionEnum;
    ySortAttr: YSortAttrEnum;
    ySortDirection: YSortDirectionEnum;
    onClickAction?: ActionValue;
    onCellClickXIdAttr?: EditableValue<Big | string>;
    onCellClickYIdAttr?: EditableValue<Big | string>;
    allowExport: boolean;
    exportButtonCaption: DynamicValue<string>;
    exportButtonClass: string;
    exportFilenamePrefix: string;
    exportFilenameDateformat: DynamicValue<string>;
    exportDataAttr?: EditableValue<string>;
    exportFilenameAttr?: EditableValue<string>;
    exportAction?: ActionValue;
    logToConsole: boolean;
    dumpServiceResponseInConsole: boolean;
}

export interface PivotTableWebWidgetPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    dataSourceType: DataSourceTypeEnum;
    cellValueAction: CellValueActionEnum;
    precisionForAverage: number | null;
    precisionForNumbers: number | null;
    useThousandSeparators: boolean;
    cellValueDateformat: string;
    showTotalColumn: boolean;
    totalColumnLabel: string;
    showTotalRow: boolean;
    totalRowLabel: string;
    noDataText: string;
    useDisplayValueForCss: boolean;
    ds: {} | { type: string } | null;
    cellValueAttr: string;
    xIdAttr: string;
    xLabelAttr: string;
    xClassAttr: string;
    yIdAttr: string;
    yLabelAttr: string;
    yClassAttr: string;
    dataChangeDateAttr: string;
    xIdDataType: XIdDataTypeEnum;
    yIdDataType: YIdDataTypeEnum;
    valueDataType: ValueDataTypeEnum;
    serviceUrl: string;
    serviceParmAttr: string;
    serviceParmList: ServiceParmListPreviewType[];
    conditionalStylingList: ConditionalStylingListPreviewType[];
    xSortAttr: XSortAttrEnum;
    xSortDirection: XSortDirectionEnum;
    ySortAttr: YSortAttrEnum;
    ySortDirection: YSortDirectionEnum;
    onClickAction: {} | null;
    onCellClickXIdAttr: string;
    onCellClickYIdAttr: string;
    allowExport: boolean;
    exportButtonCaption: string;
    exportButtonClass: string;
    exportFilenamePrefix: string;
    exportFilenameDateformat: string;
    exportDataAttr: string;
    exportFilenameAttr: string;
    exportAction: {} | null;
    logToConsole: boolean;
    dumpServiceResponseInConsole: boolean;
}
