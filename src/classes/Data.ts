import { AxisSortType, AxisKeyData, AxisMap, ErrorArray, ModelCellData, ModelCellValue, ModelData } from "../types/CustomTypes";
import { Big } from "big.js";
import { PivotTableWebWidgetContainerProps, XSortAttrEnum } from "../../typings/PivotTableWebWidgetProps";
import { ListAttributeValue, ObjectItem, ValueStatus } from "mendix";

export default class Data {
    private _widgetName: string;
    private _xAxisSortType: AxisSortType = undefined;
    private _yAxisSortType: AxisSortType = undefined;
    private _modelData: ModelData = {
        valueMap: new Map<string, ModelCellData>(),
        xAxisMap: new Map<ModelCellValue, AxisKeyData>(),
        yAxisMap: new Map<ModelCellValue, AxisKeyData>()
    };

    constructor(widgetName: string) {
        this._widgetName = widgetName;
    }

    validateProps(widgetProps: PivotTableWebWidgetContainerProps): ErrorArray {
        const { dataSourceType } = widgetProps;

        switch (dataSourceType) {
            case "datasource":
                return this.validateDatasourceProps(widgetProps);

            case "serviceCall":
                return this.validateServiceProps(widgetProps);
        }
    }

    private validateDatasourceProps(widgetProps: PivotTableWebWidgetContainerProps): ErrorArray {
        const { ds, cellValueAction, cellValueAttr, xIdAttr, xLabelAttr, xSortAttr, yIdAttr, yLabelAttr, ySortAttr } = widgetProps;

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

    private validateServiceProps(widgetProps: PivotTableWebWidgetContainerProps): ErrorArray {
        const { serviceUrl } = widgetProps;

        const result: ErrorArray = [];

        if (!serviceUrl) {
            result.push("Service URL not set");
        }

        return result;
    }

    getDataFromDatasource(widgetProps: PivotTableWebWidgetContainerProps): void {
        if (widgetProps.logToConsole) {
            this.logToConsole("getDataFromDatasource start");
        }

        this.clearData();

        const { ds } = widgetProps;

        // Extra check, we know ds.items will be filled at this point but the syntax checker only sees something that can be undefined.
        if (!ds?.items) {
            return;
        }

        // Process the datasource items
        ds.items.map(item => this.getDataItemFromDatasource(item, widgetProps));

        // Create table data
        this.createTableData(widgetProps);

        // Done
        if (widgetProps.logToConsole) {
            this.logToConsole("getDataFromDatasource end, _xAxisSortType: " + this._xAxisSortType + ", _yAxisSortType: " + this._yAxisSortType);
        }
    }

    private getDataItemFromDatasource(item: ObjectItem, widgetProps: PivotTableWebWidgetContainerProps): void {
        const { cellValueAction, cellValueAttr, xIdAttr, xLabelAttr, yIdAttr, yLabelAttr } = widgetProps;
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
            return value.getTime();
        }

        // Numeric
        if (value instanceof Big) {
            return Number(value);
        }

        // String
        return editableValue.displayValue;
    }

    getDataFromService(widgetProps: PivotTableWebWidgetContainerProps): Promise<void> {
        const { serviceUrl, logToConsole, xIdDataType, yIdDataType } = widgetProps;
        return new Promise((resolve, reject) => {
            // Extra check, we know url will be filled at this point but the syntax checker only sees something that can be undefined.
            if (serviceUrl?.status !== ValueStatus.Available) {
                return reject(new Error("getDataFromService: URL not set"));
            }

            if (logToConsole) {
                this.logToConsole("getDataFromService: " + serviceUrl.value);
            }

            this.clearData();

            // Set the sort type using the property values.
            this._xAxisSortType = xIdDataType === "integer" ? "number" : "string";
            this._yAxisSortType = yIdDataType === "integer" ? "number" : "string";

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
                            this.processDataFromService(data, widgetProps);
                            return resolve();
                        });
                    } else {
                        return Promise.reject(new Error("Call to URL " + serviceUrl.value + "failed: " + response.statusText));
                    }
                });
        });
    }

    private processDataFromService(data: any, widgetProps: PivotTableWebWidgetContainerProps): void {
        if (widgetProps.logToConsole) {
            this.logToConsole("processDataFromService");
            console.dir(data);
        }
        const { cellValueAction } = widgetProps;
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
        this.createTableData(widgetProps);
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

    private createTableData(widgetProps: PivotTableWebWidgetContainerProps): void {
        if (widgetProps.logToConsole) {
            this.logToConsole("createTableData");
        }

        // Create arrays from the axis maps in the requested order
        this.createAxisArrays(widgetProps);
    }

    private createAxisArrays(widgetProps: PivotTableWebWidgetContainerProps): void {
        const { xSortAttr, ySortAttr } = widgetProps;
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

    get modelData(): ModelData {
        return this._modelData;
    }

    private clearData(): void {
        this._modelData.valueMap.clear();
        this._modelData.xAxisMap.clear();
        this._modelData.yAxisMap.clear();
    }

    private logToConsole(message: string): void {
        console.info(this._widgetName + new Date().toISOString() + " " + message);
    }
}
