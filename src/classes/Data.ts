import { ModelCellValue, ModelData, ModelCellData, ErrorArray } from "../types/CustomTypes";
import { Big } from "big.js";
import { PivotTableWebWidgetContainerProps } from "../../typings/PivotTableWebWidgetProps";
import { ListAttributeValue, ObjectItem, ValueStatus } from "mendix";

export default class Data {
    private _widgetName: string;
    private _modelData: ModelData = {
        valueMap: new Map<string, ModelCellData>()
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
        const { ds, cellValueAction, cellValueAttr, xIdAttr, yIdAttr } = widgetProps;

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

        this._modelData.valueMap.clear();

        const { ds } = widgetProps;

        // Extra check, we know ds.items will be filled at this point but the syntax checker only sees something that can be undefined.
        if (!ds?.items) {
            return;
        }

        ds.items.map(item => this.getDataItemFromDatasource(item, widgetProps));
        if (widgetProps.logToConsole) {
            this.logToConsole("getDataFromDatasource end");
        }
    }

    private getDataItemFromDatasource(item: ObjectItem, widgetProps: PivotTableWebWidgetContainerProps): void {
        const { cellValueAction, cellValueAttr, xIdAttr, yIdAttr } = widgetProps;
        const { valueMap } = this.modelData;

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
    }

    private getModelCellValue(item: ObjectItem, attr?: ListAttributeValue<Big | Date | string>, ): ModelCellValue {
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
        const { serviceUrl, logToConsole } = widgetProps;
        return new Promise((resolve, reject) => {
            // Extra check, we know url will be filled at this point but the syntax checker only sees something that can be undefined.
            if (serviceUrl?.status !== ValueStatus.Available) {
                return reject(new Error("getDataFromService: URL not set"));
            }

            if (logToConsole) {
                this.logToConsole("getDataFromService: " + serviceUrl.value);
            }

            this._modelData.valueMap.clear();

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
                        return Promise.reject(
                            new Error("Call to URL " + serviceUrl.value + "failed: " + response.statusText)
                        );
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
        const { valueMap } = this._modelData;

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
            }
        }
    }

    get modelData(): ModelData {
        return this._modelData;
    }

    private logToConsole(message: string): void {
        console.info(this._widgetName + new Date().toISOString() + " " + message);
    }
}
