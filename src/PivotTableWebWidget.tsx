import { Component, ReactNode, createElement } from "react";
import { PivotTableWebWidgetContainerProps } from "../typings/PivotTableWebWidgetProps";
import { ValueStatus } from "mendix";
import { ErrorArray, ModelCellData } from "./types/CustomTypes";
// import { TableData } from "./types/CustomTypes";

import "./ui/PivotTableWebWidget.css";
import Data from "./classes/Data";

export default class PivotTableWebWidget extends Component<PivotTableWebWidgetContainerProps> {
    private previousDataChangeDate?: Date = undefined;
    private data: Data;
    private errorArray: ErrorArray;
    constructor(props: PivotTableWebWidgetContainerProps) {
        super(props);
        this.data = new Data(props.name);
        this.errorArray = this.data.validateProps(props);
        this.state = {
            lastServiceDataUpdate: undefined
        };
    }

    render(): ReactNode {
        const { dataChangeDateAttr, dataSourceType, ds, serviceUrl } = this.props;

        if (this.errorArray.length > 0) {
            return this.renderErrors();
        }

        if (dataChangeDateAttr?.status !== ValueStatus.Available) {
            if (this.props.logToConsole) {
                this.logToConsole("render: dataChangeDateAttr not yet available");
            }
            return null;
        }
        switch (dataSourceType) {
            case "datasource":
                // Do not check for ds status here. If it is loading, we render current data, if any, this prevents flickering.
                if (!ds?.items) {
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

    renderErrors(): ReactNode {
        if (this.props.logToConsole) {
            this.logToConsole("renderErrors");
        }

        const className = "PivotDataWidget configurationErrors";
        return (
            <div className={className}>
                <h3>Pivot table widget {this.props.name} has configuration errors</h3>
                <ul className="errorList">
                    {this.errorArray.map((item: string, index) => {
                        return <li key={index}>{item}</li>;
                    })}
                </ul>
            </div>
        );
    }

    renderTest(): ReactNode[] {
        if (this.props.logToConsole) {
            this.logToConsole("renderTest");
        }
        const result: ReactNode[] = [];
        this.data.modelData.valueMap.forEach((value: ModelCellData, key: string) => {
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

        // Load the data
        switch (dataSourceType) {
            case "datasource":
                this.data.getDataFromDatasource(this.props);
                break;

            case "serviceCall":
                this.getDataFromService();
                break;
        }
        if (this.props.logToConsole) {
            this.logToConsole("getData end");
        }
    }

    getDataFromService(): void {
        this.data.getDataFromService(this.props).then(() => {
            if (this.props.logToConsole) {
                this.logToConsole("getData: Change the state to force render.");
            }
            this.setState({
                lastServiceDataUpdate: new Date()
            });
        });
    }

    logToConsole(message: string): void {
        console.info(this.props.name + new Date().toISOString() + " " + message);
    }

    logErrorToConsole(message: string): void {
        console.error(this.props.name + new Date().toISOString() + " " + message);
    }
}
