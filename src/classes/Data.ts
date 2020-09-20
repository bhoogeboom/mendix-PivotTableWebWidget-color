// eslint-disable-next-line prettier/prettier
import { AxisSortType, AxisKeyData, AxisMap, ErrorArray, ModelCellData, ModelCellValue, ModelData, TableCellData, TableRowData, ValueDataType } from "../types/CustomTypes";
import { Big } from "big.js";
import { PivotTableWebWidgetContainerProps, XSortAttrEnum } from "../../typings/PivotTableWebWidgetProps";
import { ListAttributeValue, ObjectItem, ValueStatus } from "mendix";

export default class Data {
    private CLASS_HEADER_COL = "pivotTableColumnHeader";
    private CLASS_HEADER_ROW = "pivotTableRowHeader";
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
    private _validActionAttrTypeCombinations = ["sum_number", "average_number", "min_date", "min_number", "max_date", "max_number", "display_string"];

    validateProps(widgetProps: PivotTableWebWidgetContainerProps): ErrorArray {
        this._widgetProps = widgetProps;
        const { dataSourceType } = this._widgetProps;

        switch (dataSourceType) {
            case "datasource":
                return this.validateDatasourceProps();

            case "serviceCall":
                return this.validateServiceProps();
        }
    }

    private validateDatasourceProps(): ErrorArray {
        const { ds, cellValueAction, cellValueAttr, xIdAttr, xLabelAttr, xSortAttr, yIdAttr, yLabelAttr, ySortAttr } = this._widgetProps;

        const result: ErrorArray = [];

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
        const { serviceUrl } = this._widgetProps;

        const result: ErrorArray = [];

        if (!serviceUrl) {
            result.push("Service URL not set");
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
        const { cellValueAction, cellValueAttr, xIdAttr, xLabelAttr, yIdAttr, yLabelAttr } = this._widgetProps;
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
                modelCellValue = cellValueAttr ? cellValueAttr(item).displayValue : "*null*";
                break;

            default:
                modelCellValue = this.getModelCellValue(item, cellValueAttr);
                break;
        }

        const xId: ModelCellValue = this.getModelCellValue(item, xIdAttr);
        const yId: ModelCellValue = this.getModelCellValue(item, yIdAttr);

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
                values: [modelCellValue]
            });
        }
        this.addAttrValuesToAxisMap(item, xAxisMap, xId, xLabelAttr);
        this.addAttrValuesToAxisMap(item, yAxisMap, yId, yLabelAttr);
    }

    private addAttrValuesToAxisMap(item: ObjectItem, axisMap: AxisMap, id: ModelCellValue, attr?: ListAttributeValue<Big | Date | string>): void {
        if (!axisMap.has(id)) {
            let labelValue: string;
            if (attr) {
                labelValue = attr(item).displayValue;
            } else {
                labelValue = "" + id;
            }
            const xAxisKeyData: AxisKeyData = {
                idValue: id,
                labelValue
            };
            axisMap.set(id, xAxisKeyData);
        }
    }

    private getModelCellValue(item: ObjectItem, attr?: ListAttributeValue<Big | Date | string>): ModelCellValue {
        if (!attr) {
            return "*null*";
        }
        const editableValue = attr(item);
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
        const { serviceUrl, logToConsole, xIdDataType, yIdDataType, valueDataType } = this._widgetProps;
        return new Promise((resolve, reject) => {
            // Extra check, we know url will be filled at this point but the syntax checker only sees something that can be undefined.
            if (serviceUrl?.status !== ValueStatus.Available) {
                return reject(new Error("getDataFromService: URL not set"));
            }

            if (logToConsole) {
                this.logMessageToConsole("getDataFromService: " + serviceUrl.value);
            }

            this.clearData();

            // Set the sort type using the property values.
            this._xAxisSortType = xIdDataType === "integer" ? "number" : "string";
            this._yAxisSortType = yIdDataType === "integer" ? "number" : "string";

            switch (valueDataType) {
                case "date":
                    this._valueDataType = "date";
                    break;

                case "decimal":
                case "integer":
                    this._valueDataType = "number";
                    break;

                default:
                    this._valueDataType = "string";
            }

            // Example taken from https://github.com/mendixlabs/charts
            // You need to include mendix client, see https://www.npmjs.com/package/mendix-client
            const token = mx.session.getConfig("csrftoken");
            window
                .fetch(serviceUrl.value, {
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
                        return Promise.reject(new Error("Call to URL " + serviceUrl.value + "failed: " + response.statusText));
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
        const { cellValueAction } = this._widgetProps;
        const { valueMap, xAxisMap, yAxisMap } = this._modelData;

        if (data && data.length) {
            for (const element of data) {
                const mapKey: string = element.idValueX + "_" + element.idValueY;
                const mapValue: ModelCellData | undefined = valueMap.get(mapKey);
                const modelCellValue: ModelCellValue = cellValueAction === "count" ? "NA" : element.value;
                if (mapValue) {
                    mapValue.values.push(modelCellValue);
                } else {
                    valueMap.set(mapKey, {
                        idValueX: element.idValueX,
                        idValueY: element.idValueY,
                        values: [modelCellValue]
                    });
                }
                this.addResponseValuesToAxisMap(xAxisMap, element.idValueX, element.labelValueX);
                this.addResponseValuesToAxisMap(yAxisMap, element.idValueY, element.labelValueY);
            }
        }

        // Create table data
        this.createTableData();
    }

    private addResponseValuesToAxisMap(axisMap: AxisMap, id: ModelCellValue, responseLabelValue: string): void {
        if (!axisMap.has(id)) {
            let labelValue: string;
            if (responseLabelValue) {
                labelValue = responseLabelValue;
            } else {
                labelValue = "" + id;
            }
            const xAxisKeyData: AxisKeyData = {
                idValue: id,
                labelValue
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

        // Create arrays from the axis maps in the requested order
        this.createAxisArrays();

        // Create the header
        this.createHeaderRow();

        // Create the body
        this.createBodyRows();

        // TODO footer if requested
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

        return result;
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
                classes: this.CLASS_HEADER_COL
            };
            return cell;
        });

        // Place top left cell at first position, can contain export button
        headerRow.cells.unshift(this.createTopLeftCell());
    }

    private createTopLeftCell(): TableCellData {
        if (this._widgetProps.logToConsole) {
            this.logMessageToConsole("createTopLeftCell");
        }

        const cell: TableCellData = { cellType: "Empty" };

        // When the export function is added, the cell will contain the export button.

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
        const { xAxisArray } = this._modelData;

        // Create the header cell array from the X axis labels
        const cells = xAxisArray.map(xAxisKey => this.createTableCell(xAxisKey, yAxisKey));

        cells.unshift({
            cellType: "RowHeader",
            cellValue: yAxisKey.labelValue,
            idValueY: "" + yAxisKey.idValue,
            classes: this.CLASS_HEADER_ROW
        });

        const row: TableRowData = { cells };
        return row;
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
            cell.cellValue = this.getTableCellValue(value);
            // For display, when requested, add the cell value as class. Useful for custom styling enum values.
            if (cellValueAction === "display" && useDisplayValueForCss) {
                cell.classes += " display-" + cell.cellValue.replace(/[^A-Za-z0-9]/g, "_");
            }
        } else {
            cell.classes = this.CLASS_CELL_EMPTY;
            // A null or empty value would case the table cell to be skipped.
            cell.cellValue = "&nbsp;";
        }

        return cell;
    }

    private getTableCellValue(cellData: ModelCellData): string {
        const { cellValueAction } = this._widgetProps;

        switch (cellValueAction) {
            case "average":
                return this.formatValue(this.getCellAverage(cellData));

            case "sum":
                return this.formatValue(this.getCellSum(cellData));

            case "min":
                return this.formatValue(this.getCellMin(cellData));

            case "max":
                return this.formatValue(this.getCellMax(cellData));

            case "display":
                return "" + this.getCellDisplayValue(cellData);
            default:
                return "" + cellData.values.length;
        }
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
                return this.formatDateFromNumber(numValue, this._widgetProps.cellValueDateformat);

            case "number":
                return this.formatDecimal(numValue);

            default:
                return "" + numValue;
        }
    }

    private formatDateFromNumber(numValue: number, dateFormat: string): string {
        return mx.parser.formatValue(new Date(numValue), "datetime", { datePattern: dateFormat });
    }

    private formatDecimal(value: number, precision?: number): string {
        if (precision === undefined) {
            precision = this._widgetProps.precisionForDecimal;
        }
        return value.toFixed(precision);
    }

    get modelData(): ModelData {
        return this._modelData;
    }

    private clearData(): void {
        this._modelData.valueMap.clear();
        this._modelData.xAxisMap.clear();
        this._modelData.yAxisMap.clear();
    }

    private logMessageToConsole(message: string): void {
        console.info(this._widgetProps.name + new Date().toISOString() + " (Data) " + message);
    }

    private addErrorToModel(message: string): void {
        if (!this._modelData.errorArray) {
            this._modelData.errorArray = [message];
        } else {
            this._modelData.errorArray.push(message);
        }
    }
}
