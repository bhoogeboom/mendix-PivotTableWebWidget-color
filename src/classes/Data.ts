// eslint-disable-next-line prettier/prettier
import { AxisSortType, AxisKeyData, AxisMap, ErrorArray, ModelCellData, ModelCellValue, ModelData, TableCellData, TableRowData, ValueDataType, InputRow, ConditionalStylingArray } from "../types/CustomTypes";
import { Big } from "big.js";
import { PivotTableWebWidgetContainerProps, XSortAttrEnum } from "../../typings/PivotTableWebWidgetProps";
import { ListAttributeValue, ObjectItem, ValueStatus } from "mendix";

export default class Data {
    private CLASS_Cell_TOP_LEFT = "pivotTableTopLeft";
    private CLASS_COL_HEADER = "pivotTableColumnHeader";
    private CLASS_ROW_HEADER = "pivotTableRowHeader";
    private CLASS_COL_TOTAL = "pivotTableColumnTotal";
    private CLASS_ROW_TOTAL = "pivotTableRowTotal";
    private CLASS_CELL = "pivotTableCell";
    private CLASS_CELL_EMPTY = "pivotTableCellEmpty";
    private _widgetProps!: PivotTableWebWidgetContainerProps; // The ! tells TypeScript not to complain about no initialization and possible undefined value.
    private _xAxisSortType: AxisSortType = undefined;
    private _yAxisSortType: AxisSortType = undefined;
    private _valueDataType: ValueDataType = "string";
    private _modelData: ModelData = {
        valueMap: new Map<string, ModelCellData>(),
        xAxisArray: [],
        yAxisArray: [],
        xAxisMap: new Map<ModelCellValue, AxisKeyData>(),
        yAxisMap: new Map<ModelCellValue, AxisKeyData>(),
        tableData: {
            headerRow: { cells: [] },
            bodyRows: []
        }
    };
    private _validActionAttrTypeCombinations = [
        "sum_number",
        "average_number",
        "min_date",
        "min_number",
        "max_date",
        "max_number",
        "display_number",
        "display_string"
    ];

    validateProps(widgetProps: PivotTableWebWidgetContainerProps): ErrorArray {
        this._widgetProps = widgetProps;
        const { dataSourceType } = this._widgetProps;

        // Note that some checks need the data or fully available properties, so these are in method validateModelData

        switch (dataSourceType) {
            case "datasource":
                return this.validateDatasourceProps();

            case "serviceCall":
                return this.validateServiceProps();
        }
    }

    private validateCommonProps(): ErrorArray {
        const { cellValueAction, showTotalColumn, showTotalRow, conditionalStylingList } = this._widgetProps;

        const result: ErrorArray = [];

        // Check whether total row/column is allowed
        if (cellValueAction !== "count" && cellValueAction !== "sum") {
            // Total row/column only allowed for count and sum
            if (showTotalColumn) {
                result.push("Total column is only supported for count and sum");
            }
            if (showTotalRow) {
                result.push("Total row is only supported for count and sum");
            }
        }

        if (cellValueAction === "display" && conditionalStylingList.length > 0) {
            result.push("Conditional styling is not allowed for action Display");
        }

        return result;
    }

    private validateDatasourceProps(): ErrorArray {
        const { ds, cellValueAction, cellValueAttr, xIdAttr, xLabelAttr, xSortAttr, yIdAttr, yLabelAttr, ySortAttr } = this._widgetProps;

        const result: ErrorArray = this.validateCommonProps();

        if (!ds) {
            result.push("Datasource not configured");
        }
        if (!cellValueAttr && cellValueAction !== "count") {
            result.push("Cell value not set");
        }
        if (!xIdAttr) {
            result.push("X-axis ID not set");
        }
        if (!yIdAttr) {
            result.push("Y-axis ID not set");
        }
        if (xSortAttr === "label") {
            if (!xLabelAttr) {
                result.push("X-axis label not set and sort is by label. Sort by ID or set a label attribute");
            }
        }
        if (ySortAttr === "label") {
            if (!yLabelAttr) {
                result.push("Y-axis label not set and sort is by label. Sort by ID or set a label attribute");
            }
        }

        return result;
    }

    private validateServiceProps(): ErrorArray {
        const { dataChangeDateAttr, serviceUrl } = this._widgetProps;

        const result: ErrorArray = this.validateCommonProps();

        if (!serviceUrl) {
            result.push("Service URL not set");
        }

        if (!dataChangeDateAttr) {
            result.push("Data changed date attribute not set");
        }

        return result;
    }

    getDataFromDatasource(widgetProps: PivotTableWebWidgetContainerProps): void {
        this._widgetProps = widgetProps;
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("getDataFromDatasource start");
        }

        this.clearData();

        const { ds } = this._widgetProps;

        // Extra check, we know ds.items will be filled at this point but the syntax checker only sees something that can be undefined.
        if (!ds?.items) {
            return;
        }

        // Process the datasource items
        ds.items.map(item => this.getDataItemFromDatasource(item));

        // Create table data
        this.createTableData();

        // Done
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("getDataFromDatasource end, _xAxisSortType: " + this._xAxisSortType + ", _yAxisSortType: " + this._yAxisSortType);
        }
    }

    private getDataItemFromDatasource(item: ObjectItem): void {
        const { cellValueAction, cellValueAttr, xIdAttr, xLabelAttr, xClassAttr, yIdAttr, yLabelAttr, yClassAttr } = this._widgetProps;
        const { valueMap, xAxisMap, yAxisMap } = this.modelData;

        if (!xIdAttr || !yIdAttr) {
            return;
        }

        let modelCellValue: ModelCellValue;
        switch (cellValueAction) {
            case "count":
                modelCellValue = "NA"; // For count the cell value is not relevant and need not be available
                break;

            case "display":
                modelCellValue = cellValueAttr ? cellValueAttr.get(item).displayValue : "*null*";
                break;

            default:
                modelCellValue = this.getModelCellValueForDatasource(item, cellValueAttr);
                break;
        }

        const xId: ModelCellValue = this.getModelCellValueForDatasource(item, xIdAttr);
        const yId: ModelCellValue = this.getModelCellValueForDatasource(item, yIdAttr);

        // Determine the sort key, from the first real value (not null)
        if (this._xAxisSortType === undefined && xId) {
            this._xAxisSortType = isNaN(Number(xId)) ? "string" : "number";
        }
        if (this._yAxisSortType === undefined && yId) {
            this._yAxisSortType = isNaN(Number(yId)) ? "string" : "number";
        }

        const mapKey: string = xId + "_" + yId;
        const mapValue: ModelCellData | undefined = valueMap.get(mapKey);
        if (mapValue) {
            mapValue.values.push(modelCellValue);
        } else {
            valueMap.set(mapKey, {
                idValueX: xId,
                idValueY: yId,
                values: [modelCellValue],
                aggregatedValue: 0
            });
        }
        this.addAttrValuesToAxisMap(item, xAxisMap, xId, xLabelAttr, xClassAttr);
        this.addAttrValuesToAxisMap(item, yAxisMap, yId, yLabelAttr, yClassAttr);
    }

    private addAttrValuesToAxisMap(
        item: ObjectItem,
        axisMap: AxisMap,
        id: ModelCellValue,
        attr?: ListAttributeValue<Big | Date | string>,
        classAttr?: ListAttributeValue<string>
    ): void {
        if (!axisMap.has(id)) {
            let labelValue: string;
            let classValue = "";
            if (attr) {
                labelValue = attr.get(item).displayValue;
            } else {
                labelValue = "" + id;
            }
            if (classAttr) {
                classValue = " " + classAttr.get(item).displayValue;
            }
            const xAxisKeyData: AxisKeyData = {
                idValue: id,
                labelValue,
                classValue
            };
            axisMap.set(id, xAxisKeyData);
        }
    }

    private getModelCellValueForDatasource(item: ObjectItem, attr?: ListAttributeValue<Big | Date | string>): ModelCellValue {
        if (!attr) {
            return "*null*";
        }
        const editableValue = attr.get(item);
        const value = editableValue.value;

        // Date
        if (value instanceof Date) {
            this._valueDataType = "date";
            return value.getTime();
        }

        // Numeric
        if (value instanceof Big) {
            this._valueDataType = "number";
            return Number(value);
        }

        // String
        return editableValue.displayValue;
    }

    getDataFromService(widgetProps: PivotTableWebWidgetContainerProps): Promise<void> {
        this._widgetProps = widgetProps;
        const { serviceUrl, serviceParmAttr, serviceParmList, logToConsole, xIdDataType, yIdDataType, valueDataType } = this._widgetProps;
        return new Promise((resolve, reject) => {
            // Extra check, we know url will be filled at this point but the syntax checker only sees something that can be undefined.
            if (serviceUrl?.status !== ValueStatus.Available) {
                return reject(new Error("getDataFromService: URL not set"));
            }

            let url = serviceUrl.value;

            // Service parameters?
            const urlHasParms = url.indexOf("?") > 0;
            // Included any parameters from the properties.
            const urlParmArray: string[] = [];
            if (serviceParmList) {
                for (const parm of serviceParmList) {
                    urlParmArray.push(parm.parameterName.value + "=" + parm.parameterValue.value);
                }
            }
            // If requested, add parameter value. As the URL may already contain parameters, check for presence of ? in the URL
            if (serviceParmAttr && serviceParmAttr.status === ValueStatus.Available) {
                urlParmArray.push("context=" + serviceParmAttr.value);
            }
            if (urlParmArray.length > 0) {
                const queryParms = urlParmArray.join("&");
                if (urlHasParms) {
                    url += "&" + queryParms;
                } else {
                    url += "?" + queryParms;
                }
            }

            if (logToConsole) {
                this.logMessageToConsole("getDataFromService: " + url);
            }

            this.clearData();

            // Set the sort type using the property values.
            this._xAxisSortType = xIdDataType === "integer" ? "number" : "string";
            this._yAxisSortType = yIdDataType === "integer" ? "number" : "string";

            switch (valueDataType) {
                case "date":
                    this._valueDataType = "date";
                    break;

                case "number":
                    this._valueDataType = "number";
                    break;

                default:
                    this._valueDataType = "string";
            }

            // Example taken from https://github.com/mendixlabs/charts
            // You need to include mendix client, see https://www.npmjs.com/package/mendix-client
            const token = mx.session.getConfig("csrftoken");
            window
                .fetch(url, {
                    credentials: "include",
                    headers: {
                        "X-Csrf-Token": token,
                        Accept: "application/json"
                    }
                })
                .then(response => {
                    if (response.ok) {
                        response.json().then(data => {
                            this.processDataFromService(data);
                            return resolve();
                        });
                    } else {
                        return Promise.reject(new Error("Call to URL " + serviceUrl.value + " failed: " + response.statusText));
                    }
                });
        });
    }

    private processDataFromService(data: any): void {
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("processDataFromService");
            if (this._widgetProps.dumpServiceResponseInConsole) {
                console.dir(data);
            }
        }
        const { valueMap, xAxisMap, yAxisMap } = this._modelData;

        if (data && data.length) {
            for (const element of data) {
                const mapKey: string = element.idValueX + "_" + element.idValueY;
                const mapValue: ModelCellData | undefined = valueMap.get(mapKey);
                const modelCellValue: ModelCellValue = this.getModelCellValueForServiceData(element);
                if (mapValue) {
                    mapValue.values.push(modelCellValue);
                } else {
                    valueMap.set(mapKey, {
                        idValueX: element.idValueX,
                        idValueY: element.idValueY,
                        values: [modelCellValue],
                        aggregatedValue: 0
                    });
                }
                this.addResponseValuesToAxisMap(xAxisMap, element.idValueX, element.labelValueX, element.classValueX);
                this.addResponseValuesToAxisMap(yAxisMap, element.idValueY, element.labelValueY, element.classValueY);
            }
        }

        // Create table data
        this.createTableData();
    }

    private getModelCellValueForServiceData(element: InputRow): ModelCellValue {
        const { cellValueAction } = this._widgetProps;
        if (cellValueAction === "count") {
            return "NA";
        }

        switch (this._valueDataType) {
            case "date":
                return new Date(element.value).getTime();

            case "number":
                return Number(element.value);

            default:
                return "" + element.value;
        }
    }

    private addResponseValuesToAxisMap(axisMap: AxisMap, id: ModelCellValue, responseLabelValue: string, responseClassValue: string): void {
        if (!axisMap.has(id)) {
            let labelValue: string;
            let classValue = "";
            if (responseLabelValue) {
                labelValue = responseLabelValue;
            } else {
                labelValue = "" + id;
            }
            if (responseClassValue) {
                classValue = " " + responseClassValue;
            }
            const xAxisKeyData: AxisKeyData = {
                idValue: id,
                labelValue,
                classValue
            };
            axisMap.set(id, xAxisKeyData);
        }
    }

    private createTableData(): void {
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("createTableData");
        }

        if (!this.validateModelData()) {
            return;
        }

        // Store conditional styling data in array, if any.
        this.createConditionalStylingArray();

        // Aggregate values
        this.aggregateValues();

        // Create arrays from the axis maps in the requested order
        this.createAxisArrays();

        // Create the header
        this.createHeaderRow();

        // Create the body
        this.createBodyRows();

        // Create the total row?
        if (this._widgetProps.showTotalRow) {
            this.createTotalRow();
        }
    }

    private validateModelData(): boolean {
        let result = true;

        const { onClickAction, onCellClickXIdAttr, onCellClickYIdAttr } = this._widgetProps;

        // Check cell value action against the cell data type. Count is always allowed.
        if (this._widgetProps.cellValueAction !== "count") {
            const key = this._widgetProps.cellValueAction + "_" + this._valueDataType;
            if (this._validActionAttrTypeCombinations.indexOf(key) < 0) {
                this.addErrorToModel("Cell value action " + this._widgetProps.cellValueAction + " is not allowed for cell data type " + this._valueDataType);
                result = false;
            }
        }

        if (onClickAction) {
            if (onCellClickXIdAttr) {
                if (onCellClickXIdAttr.status === ValueStatus.Available && onCellClickXIdAttr.readOnly) {
                    this.addErrorToModel("On click X-axis ID attribute is readonly, be sure to set your dataview to editable and grant access");
                    result = false;
                }
            } else {
                this.addErrorToModel("On click X-axis ID attribute is required when On click action is configured");
                result = false;
            }
            if (onCellClickYIdAttr) {
                if (onCellClickYIdAttr.status === ValueStatus.Available && onCellClickYIdAttr.readOnly) {
                    this.addErrorToModel("On click Y-axis ID attribute is readonly, be sure to set your dataview to editable and grant access");
                    result = false;
                }
            } else {
                this.addErrorToModel("On click Y-axis ID attribute is required when On click action is configured");
                result = false;
            }
        }

        const { conditionalStylingList } = this._widgetProps;

        if (conditionalStylingList.length > 0) {
            for (const item of conditionalStylingList) {
                switch (this._valueDataType) {
                    case "date":
                        if (!item.dateThresholdValue?.value) {
                            this.addErrorToModel("Conditional styling must have date values for date cell values.");
                        }
                        break;

                    case "number":
                        if (!item.decimalThresholdValue?.value) {
                            this.addErrorToModel("Conditional styling must have decimal values for numeric cell values.");
                        }
                        break;

                    default:
                        this.addErrorToModel("Conditional styling can only be used for dates and numeric values.");
                        break;
                }
            }
        }

        const { allowExport, exportDataAttr, exportFilenameAttr, exportAction } = this._widgetProps;

        if (allowExport) {
            if (exportDataAttr) {
                if (exportDataAttr.status === ValueStatus.Available && exportDataAttr.readOnly) {
                    this.addErrorToModel("Export data attribute is readonly, be sure to set your dataview to editable and grant access");
                    result = false;
                }
            } else {
                this.addErrorToModel("Export data attribute is required when export is allowed");
                result = false;
            }
            if (exportFilenameAttr) {
                if (exportFilenameAttr.status === ValueStatus.Available && exportFilenameAttr.readOnly) {
                    this.addErrorToModel("Export file name attribute is readonly, be sure to set your dataview to editable and grant access");
                    result = false;
                }
            } else {
                this.addErrorToModel("Export file name attribute is required when export is allowed");
                result = false;
            }
            if (!exportAction) {
                this.addErrorToModel("Export action is required when export is allowed");
                result = false;
            }
        }

        return result;
    }

    private createConditionalStylingArray(): void {
        const { conditionalStylingList } = this._widgetProps;

        if (conditionalStylingList.length > 0) {
            // Create an array of numeric values and the classes to use
            const conditionalStylingArray: ConditionalStylingArray = [];
            for (const item of conditionalStylingList) {
                let value = 0;
                // Date is used as millis. Check whether we have a value before using it.
                switch (this._valueDataType) {
                    case "date":
                        if (item.dateThresholdValue?.value) {
                            value = item.dateThresholdValue.value.getTime();
                        }
                        break;

                    case "number":
                        if (item.decimalThresholdValue?.value) {
                            value = Number(item.decimalThresholdValue.value);
                        }
                        break;
                }
                conditionalStylingArray.push({
                    className: item.className?.value ? item.className.value : "",
                    value
                });
            }

            // Sort the array
            this._modelData.conditionalStylingArray = conditionalStylingArray.sort((itemA, itemB) => {
                if (itemA.value < itemB.value) {
                    return -1;
                }
                if (itemB.value > itemA.value) {
                    return 1;
                }
                return 0;
            });
        }
    }

    private createAxisArrays(): void {
        const { xSortAttr, ySortAttr } = this._widgetProps;
        this.modelData.xAxisArray = this.createAxisArray(xSortAttr, this._xAxisSortType, this.modelData.xAxisMap);
        this.modelData.yAxisArray = this.createAxisArray(ySortAttr, this._yAxisSortType, this.modelData.yAxisMap);
    }

    private createAxisArray(sortAttr: XSortAttrEnum, axisSortType: AxisSortType, axisMap: AxisMap): AxisKeyData[] {
        const unsortedArray: AxisKeyData[] = Array.from(axisMap.values());

        // When requested to sort on ID, decide whether to sort numerically or as text.
        // When sorting as text, use lowercase value.
        return unsortedArray.sort((a: AxisKeyData, b: AxisKeyData) => {
            let keyA: ModelCellValue;
            let keyB: ModelCellValue;
            if (sortAttr === "id") {
                if (axisSortType === "number") {
                    keyA = Number(a.idValue);
                    keyB = Number(b.idValue);
                } else {
                    keyA = ("" + a.idValue).toLowerCase();
                    keyB = ("" + b.idValue).toLowerCase();
                }
            } else {
                keyA = a.labelValue.toLowerCase();
                keyB = b.labelValue.toLowerCase();
            }
            if (keyA < keyB) {
                return -1;
            }
            if (keyA > keyB) {
                return 1;
            }
            return 0;
        });
    }

    private aggregateValues(): void {
        this._modelData.valueMap.forEach(cellData => this.aggregateCellValue(cellData));
    }

    private aggregateCellValue(cellData: ModelCellData): void {
        const { cellValueAction } = this._widgetProps;

        switch (cellValueAction) {
            case "average":
                cellData.aggregatedValue = this.getCellAverage(cellData);
                break;

            case "sum":
                cellData.aggregatedValue = this.getCellSum(cellData);
                break;

            case "min":
                cellData.aggregatedValue = this.getCellMin(cellData);
                break;

            case "max":
                cellData.aggregatedValue = this.getCellMax(cellData);
                break;

            case "display":
                break;

            default:
                // Count, catch all
                cellData.aggregatedValue = cellData.values.length;
        }
    }

    private createHeaderRow(): void {
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("createHeaderRow");
        }

        const { xAxisArray } = this._modelData;
        const { headerRow } = this._modelData.tableData;

        // Create the header cell array from the X axis labels
        headerRow.cells = xAxisArray.map(xAxisKey => {
            const cell: TableCellData = {
                cellType: "ColumnHeader",
                cellValue: xAxisKey.labelValue,
                idValueX: "" + xAxisKey.idValue,
                classes: this.CLASS_COL_HEADER + xAxisKey.classValue
            };
            return cell;
        });

        if (this._widgetProps.showTotalColumn) {
            headerRow.cells.push({
                cellType: "ColumnHeader",
                cellValue: this._widgetProps.totalColumnLabel?.value ? this._widgetProps.totalColumnLabel.value : "",
                classes: this.CLASS_COL_HEADER
            });
        }

        // Place top left cell at first position, can contain export button
        headerRow.cells.unshift(this.createTopLeftCell());
    }

    private createTopLeftCell(): TableCellData {
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("createTopLeftCell");
        }

        const { allowExport } = this._widgetProps;

        const cell: TableCellData = {
            cellType: allowExport ? "ExportButton" : "EmptyTopLeft",
            classes: this.CLASS_Cell_TOP_LEFT
        };

        return cell;
    }

    private createBodyRows(): void {
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("createBodyRows");
        }

        const { yAxisArray, tableData } = this._modelData;
        tableData.bodyRows = yAxisArray.map(item => this.createBodyRow(item));
    }

    private createBodyRow(yAxisKey: AxisKeyData): TableRowData {
        const { xAxisArray, valueMap } = this._modelData;

        // Create the cell array for the row
        const cells = xAxisArray.map(xAxisKey => this.createTableCell(xAxisKey, yAxisKey));

        if (this._widgetProps.showTotalColumn) {
            let rowTotal = 0;
            for (const xAxisKey of xAxisArray) {
                const mapKey: string = xAxisKey.idValue + "_" + yAxisKey.idValue;
                const value = valueMap.get(mapKey);
                if (value) {
                    rowTotal += value.aggregatedValue;
                }
            }
            cells.push({
                cellType: "RowTotal",
                cellValue: this.formatValue(rowTotal),
                idValueY: "" + yAxisKey.idValue,
                classes: this.CLASS_ROW_TOTAL
            });
        }

        // Add the row header before the cells.
        cells.unshift({
            cellType: "RowHeader",
            cellValue: yAxisKey.labelValue,
            idValueY: "" + yAxisKey.idValue,
            classes: this.CLASS_ROW_HEADER + yAxisKey.classValue
        });

        const row: TableRowData = { cells };
        return row;
    }

    private createTotalRow(): void {
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("createTotalRow");
        }

        const { xAxisArray, yAxisArray, valueMap } = this._modelData;

        // Create the footer cell array from the X axis labels
        let rowTotal = 0;
        const cells = xAxisArray.map(xAxisKey => {
            let columnTotal = 0;
            for (const yAxisKey of yAxisArray) {
                const mapKey: string = xAxisKey.idValue + "_" + yAxisKey.idValue;
                const value = valueMap.get(mapKey);
                if (value) {
                    columnTotal += value.aggregatedValue;
                }
            }
            rowTotal += columnTotal;

            const cell: TableCellData = {
                cellType: "ColumnTotal",
                cellValue: this.formatValue(columnTotal),
                idValueX: "" + xAxisKey.idValue,
                classes: this.CLASS_COL_TOTAL
            };
            return cell;
        });

        // Total of all row values.
        if (this._widgetProps.showTotalColumn) {
            cells.push({
                cellType: "RowColumnTotal",
                cellValue: this.formatValue(rowTotal),
                classes: this.CLASS_ROW_TOTAL
            });
        }

        // Add the row header before the cells.
        cells.unshift({
            cellType: "RowHeader",
            cellValue: this._widgetProps.totalRowLabel?.value ? this._widgetProps.totalRowLabel.value : "",
            classes: this.CLASS_ROW_HEADER
        });

        this._modelData.tableData.footerRow = { cells };
    }

    private createTableCell(xAxisKey: AxisKeyData, yAxisKey: AxisKeyData): TableCellData {
        const { valueMap } = this._modelData;
        const { cellValueAction, useDisplayValueForCss } = this._widgetProps;

        const cell: TableCellData = {
            cellType: "Value",
            idValueX: "" + xAxisKey.idValue,
            idValueY: "" + yAxisKey.idValue
        };

        const mapKey: string = xAxisKey.idValue + "_" + yAxisKey.idValue;
        const value = valueMap.get(mapKey);
        if (value) {
            cell.classes = this.CLASS_CELL;
            if (cellValueAction === "display") {
                cell.cellValue = this.getCellDisplayValue(value);
            } else {
                cell.cellValue = this.formatValue(value.aggregatedValue);
            }
            // For display, when requested, add the cell value as class. Useful for custom styling enum values.
            if (cellValueAction === "display" && useDisplayValueForCss) {
                cell.classes += " display-" + cell.cellValue.replace(/[^A-Za-z0-9]/g, "_").toLowerCase();
            }
            if (cellValueAction !== "display") {
                const conditionalStylingClass = this.getConditionalStylingClass(value);
                if (conditionalStylingClass) {
                    cell.classes += " " + conditionalStylingClass;
                }
            }
        } else {
            cell.classes = this.CLASS_CELL_EMPTY;
            // A null value would cause the table cell to be skipped.
            cell.cellValue = "";
        }

        return cell;
    }

    private getConditionalStylingClass(value: ModelCellData): string | undefined {
        const { conditionalStylingArray } = this._modelData;

        if (!conditionalStylingArray) {
            return undefined;
        }

        // Loop through the conditional styling array. Take the class name when aggregated value >= item value.
        // If the aggregated value exceeds the value of multiple items, the result will be that the item with the highest matching value is used.
        // (The array is sorted on value.)
        let className: string | undefined;
        for (const item of conditionalStylingArray) {
            if (value.aggregatedValue >= item.value) {
                className = item.className;
            }
        }

        return className;
    }

    private getCellSum(cellData: ModelCellData): number {
        let total = 0;
        for (const value of cellData.values) {
            if (value) {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    total += numValue;
                }
            }
        }
        return total;
    }

    private getCellMin(cellData: ModelCellData): number {
        let minValue = +Infinity;
        for (const value of cellData.values) {
            if (value) {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    if (numValue < minValue) {
                        minValue = numValue;
                    }
                }
            }
        }
        return minValue;
    }

    private getCellMax(cellData: ModelCellData): number {
        let minValue = -Infinity;
        for (const value of cellData.values) {
            if (value) {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    if (numValue > minValue) {
                        minValue = numValue;
                    }
                }
            }
        }
        return minValue;
    }

    private getCellAverage(cellData: ModelCellData): number {
        return this.getCellSum(cellData) / cellData.values.length;
    }

    private getCellDisplayValue(cellData: ModelCellData): string {
        return cellData.values.join();
    }

    private formatValue(numValue: number): string {
        switch (this._valueDataType) {
            case "date":
                const { cellValueDateformat } = this._widgetProps;
                const dateFormat = cellValueDateformat?.value ? cellValueDateformat.value : "dd-MM-yyyy";
                return this.formatDateFromNumber(numValue, dateFormat);

            case "number":
                return this.formatNumericValue(numValue);

            default:
                return "" + numValue;
        }
    }

    private formatDateFromNumber(numValue: number, dateFormat: string): string {
        return mx.parser.formatValue(new Date(numValue), "datetime", { datePattern: dateFormat });
    }

    private formatNumericValue(value: number, precision?: number): string {
        const { precisionForNumbers, useThousandSeparators } = this._widgetProps;
        if (precision === undefined) {
            precision = precisionForNumbers;
        }
        return mx.parser.formatValue(value, "decimal", { places: precision, groups: useThousandSeparators });
    }

    get modelData(): ModelData {
        return this._modelData;
    }

    get valueDataType(): ValueDataType {
        return this._valueDataType;
    }

    private clearData(): void {
        this._modelData.valueMap.clear();
        this._modelData.xAxisMap.clear();
        this._modelData.yAxisMap.clear();
    }

    private logMessageToConsole(message: string): void {
        console.info(this._widgetProps.name + " " + new Date().toISOString() + " (Data) " + message);
    }

    private addErrorToModel(message: string): void {
        if (!this._modelData.errorArray) {
            this._modelData.errorArray = [message];
        } else {
            this._modelData.errorArray.push(message);
        }
    }
}
