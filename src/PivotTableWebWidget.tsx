import { Component, ReactNode, createElement } from "react";
import { PivotTableWebWidgetContainerProps } from "../typings/PivotTableWebWidgetProps";
import { ValueStatus } from "mendix";
import { ErrorArray, TableCellData, TableRowData } from "./types/CustomTypes";
// import { TableData } from "./types/CustomTypes";

import "./ui/PivotTableWebWidget.css";
import Data from "./classes/Data";

export default class PivotTableWebWidget extends Component<PivotTableWebWidgetContainerProps> {
    private previousDataChangeDate?: Date = undefined;
    private data: Data;
    private errorArray: ErrorArray;
    constructor(props: PivotTableWebWidgetContainerProps) {
        super(props);
        this.data = new Data(props.name, props.logToConsole);
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
                this.logMessageToConsole("render: dataChangeDateAttr not yet available");
            }
            return null;
        }
        switch (dataSourceType) {
            case "datasource":
                // Do not check for ds status here. If it is loading, we render current data, if any, this prevents flickering.
                if (!ds?.items) {
                    if (this.props.logToConsole) {
                        this.logMessageToConsole("render: ds not yet available");
                    }
                    return null;
                }
                break;

            case "serviceCall":
                if (serviceUrl?.status !== ValueStatus.Available) {
                    if (this.props.logToConsole) {
                        this.logMessageToConsole("render: service URL not yet available");
                    }
                    return null;
                }
                break;

            default:
                return null;
        }

        if (this.props.logToConsole) {
            this.logMessageToConsole("render");
        }

        this.getData();

        return this.renderTable();
    }

    renderErrors(): ReactNode {
        if (this.props.logToConsole) {
            this.logMessageToConsole("renderErrors");
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

    renderTable(): ReactNode {
        if (this.props.logToConsole) {
            this.logMessageToConsole("renderTable");
        }

        const { tableData } = this.data.modelData;
        const className = "PivotDataWidget " + this.props.class;
        return (
            <div className={className}>
                <table>
                    <thead>
                        <tr>{tableData.headerRow.cells.map(item => this.renderCell(item))}</tr>
                    </thead>
                    <tbody>{tableData.bodyRows.map(item => this.renderTableRow(item))}</tbody>
                </table>
            </div>
        );
    }

    renderTableRow(rowData: TableRowData): ReactNode {
        const rowKey = "tr_" + rowData.cells[0].idValueY;
        return <tr key={rowKey}>{rowData.cells.map(item => this.renderCell(item))}</tr>;
    }

    renderCell(cell: TableCellData): ReactNode {
        switch (cell.cellType) {
            case "ColumnHeader":
                const colKey = "x_" + cell.idValueX;
                return (
                    <th key={colKey} className={cell.classes}>
                        {cell.cellValue}
                    </th>
                );
            case "RowHeader":
                const rowKey = "y_" + cell.idValueY;
                return (
                    <th key={rowKey} className={cell.classes}>
                        {cell.cellValue}
                    </th>
                );

            default:
                const cellKey = "c_" + cell.idValueY + cell.idValueX;
                return (
                    <td key={cellKey} className={cell.classes}>
                        {cell.cellValue}
                    </td>
                );
        }
    }

    getData(): void {
        const { dataChangeDateAttr, dataSourceType } = this.props;
        if (this.props.logToConsole) {
            this.logMessageToConsole("getData");
        }

        // We need a datachanged attribute value.
        if (dataChangeDateAttr.value) {
            // Only if the date is different to prevent getting the data (especially web service) when the render is only about resizing etc.
            if (this.previousDataChangeDate && dataChangeDateAttr.value?.getTime() === this.previousDataChangeDate?.getTime()) {
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
            this.logMessageToConsole("getData end");
        }
    }

    getDataFromService(): void {
        this.data.getDataFromService(this.props).then(() => {
            if (this.props.logToConsole) {
                this.logMessageToConsole("getData: Change the state to force render.");
            }
            this.setState({
                lastServiceDataUpdate: new Date()
            });
        });
    }

    logMessageToConsole(message: string): void {
        console.info(this.props.name + new Date().toISOString() + " " + message);
    }

    logErrorToConsole(message: string): void {
        console.error(this.props.name + new Date().toISOString() + " " + message);
    }
}
