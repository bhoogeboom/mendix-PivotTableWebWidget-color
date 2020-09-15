import { ModelCellValue, ModelData, ModelCellData } from "../types/CustomTypes";
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
            this.logToConsole("getDataFromDatasource done");
        }
    }

    private getDataItemFromDatasource(item: ObjectItem, widgetProps: PivotTableWebWidgetContainerProps): void {
        const { cellValueAction, cellValueAttr, xIdAttr, yIdAttr } = widgetProps;
        const { valueMap } = this.modelData;

        if (!cellValueAttr || !xIdAttr || !yIdAttr) {
            return;
        }

        let modelCellValue: ModelCellValue;
        if (cellValueAction === "display") {
            modelCellValue = cellValueAttr(item).displayValue;
        } else {
            modelCellValue = this.getModelCellValue(cellValueAttr, item);
        }

        const xId: ModelCellValue = this.getModelCellValue(xIdAttr, item);
        const yId: ModelCellValue = this.getModelCellValue(yIdAttr, item);

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

    private getModelCellValue(attr: ListAttributeValue<Big | Date | string>, item: ObjectItem): ModelCellValue {
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
        const { valueMap } = this._modelData;

        if (data && data.length) {
            for (const element of data) {
                const mapKey: string = element.idValueX + "_" + element.idValueY;
                const mapValue: ModelCellData | undefined = valueMap.get(mapKey);
                if (mapValue) {
                    mapValue.values.push(element.value);
                } else {
                    valueMap.set(mapKey, {
                        idValueX: element.idValueX,
                        idValueY: element.idValueY,
                        values: [element.value]
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
