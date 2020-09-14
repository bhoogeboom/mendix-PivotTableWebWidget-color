/* global mx */
import { Component, ReactNode, createElement } from "react";
import { PivotTableWebWidgetContainerProps } from "../typings/PivotTableWebWidgetProps";
import { ListAttributeValue, ObjectItem, ValueStatus } from "mendix";
import { ModelCellValue, ModelData, ModelCellData } from "./types/CustomTypes";
import { Big } from "big.js";
// import { TableData } from "./types/CustomTypes";

import "./ui/PivotTableWebWidget.css";

export default class PivotTableWebWidget extends Component<PivotTableWebWidgetContainerProps> {
    private previousDataChangeDate?: Date = undefined;
    private modelData: ModelData = {
        valueMap: new Map<string, ModelCellData>()
    };
    constructor(props: PivotTableWebWidgetContainerProps) {
        super(props);
        this.state = {
            lastServiceDataUpdate: undefined
        };
    }

    render(): ReactNode {
        const { dataChangeDateAttr, dataSourceType, ds, cellValueAttr, xIdAttr, yIdAttr, serviceUrl } = this.props;

        if (dataChangeDateAttr?.status !== ValueStatus.Available) {
            if (this.props.logToConsole) {
                this.logToConsole("render: dataChangeDateAttr not yet available");
            }
            return null;
        }
        // @TODO Hier nog validatie van de properties inbouwen.
        switch (dataSourceType) {
            case "datasource":
                // Do not check for ds status here. If it is loading, we render current data, if any, this prevents flickering.
                if (!ds?.items || !cellValueAttr || !xIdAttr || !yIdAttr) {
                    if (this.props.logToConsole) {
                        this.logToConsole("render: ds not yet available");
                    }
                    return null;
                }
                break;

            case "serviceCall":
                if (serviceUrl?.status !== ValueStatus.Available) {
                    if (this.props.logToConsole) {
                        this.logToConsole("render: service URL not yet available");
                    }
                    return null;
                }
                break;

            default:
                return null;
        }

        if (this.props.logToConsole) {
            this.logToConsole("render");
        }

        this.getData();

        const className = "PivotDataWidget " + this.props.class;
        return (
            <div className={className}>
                <ul>{this.renderTest()}</ul>
            </div>
        );
    }

    renderTest(): ReactNode[] {
        if (this.props.logToConsole) {
            this.logToConsole("renderTest");
        }
        const result: ReactNode[] = [];
        this.modelData.valueMap.forEach((value: ModelCellData, key: string) => {
            result.push(this.renderTestValue(value, key));
        }, this);

        return result;
    }

    renderTestValue(value: ModelCellData, key: string): ReactNode {
        return (
            <li key={key} id={key}>
                <span>
                    {value.idValueX} - {value.idValueY} : {value.values.length}
                </span>
            </li>
        );
    }

    getData(): void {
        const { dataChangeDateAttr, dataSourceType } = this.props;
        if (this.props.logToConsole) {
            this.logToConsole("getData");
        }

        // We need a datachanged attribute value.
        if (dataChangeDateAttr.value) {
            // Only if the date is different to prevent getting the data (especially web service) when the render is only about resizing etc.
            if (
                this.previousDataChangeDate &&
                dataChangeDateAttr.value?.getTime() === this.previousDataChangeDate?.getTime()
            ) {
                return;
            }
        } else {
            this.logErrorToConsole("Data changed date is not set");
            return;
        }

        // Store the date, also prevents multiple renders all triggering reload of the data.
        this.previousDataChangeDate = dataChangeDateAttr.value;

        // Clear the model;
        this.modelData.valueMap.clear();

        // Load the data
        switch (dataSourceType) {
            case "datasource":
                this.getDataFromDatasource();
                break;

            case "serviceCall":
                this.getDataFromService();
                break;
        }
    }

    getDataFromDatasource(): void {
        if (this.props.logToConsole) {
            this.logToConsole("getDataFromDatasource start");
        }
        const { ds } = this.props;

        // Extra check, we know ds.items will be filled at this point but the syntax checker only sees something that can be undefined.
        if (!ds?.items) {
            return;
        }

        ds.items.map(item => this.getDataItemFromDatasource(item));
        if (this.props.logToConsole) {
            this.logToConsole("getDataFromDatasource done");
        }
    }

    getDataItemFromDatasource(item: ObjectItem): void {
        const { cellValueAction, cellValueAttr, xIdAttr, yIdAttr } = this.props;
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

    getModelCellValue(attr: ListAttributeValue<Big | Date | string>, item: ObjectItem): ModelCellValue {
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

    getDataFromService(): void {
        const { serviceUrl } = this.props;

        // Extra check, we know url will be filled at this point but the syntax checker only sees something that can be undefined.
        if (serviceUrl?.status !== ValueStatus.Available) {
            return;
        }

        if (this.props.logToConsole) {
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
                    response.json().then(data => this.processDataFromService(data));
                } else {
                    this.logErrorToConsole("Call to URL " + serviceUrl.value + "failed: " + response.statusText);
                }
            });
    }

    processDataFromService(data: any): void {
        if (this.props.logToConsole) {
            this.logToConsole("processDataFromService");
            console.dir(data);
        }
        const { valueMap } = this.modelData;

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

        /*

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

 */

        // Change the state to force render.
        this.setState({
            lastServiceDataUpdate: new Date()
        });
    }

    logToConsole(message: string): void {
        console.info(this.props.name + new Date().toISOString() + " " + message);
    }

    logErrorToConsole(message: string): void {
        console.error(this.props.name + new Date().toISOString() + " " + message);
    }
}
