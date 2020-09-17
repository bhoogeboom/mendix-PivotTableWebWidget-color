import { Component, ReactNode, createElement } from "react";
import { PivotTableWebWidgetContainerProps } from "../typings/PivotTableWebWidgetProps";
import { ValueStatus } from "mendix";
import { ErrorArray, TableCellData, TableData, TableRowData } from "./types/CustomTypes";
// import { TableData } from "./types/CustomTypes";

import "./ui/PivotTableWebWidget.css";
import Data from "./classes/Data";

export default class PivotTableWebWidget extends Component<PivotTableWebWidgetContainerProps> {
    private CLASS_WIDGET = "pivotTableWidget";
    private CLASS_CONFIG_ERRORS = "configurationErrors";
    private CLASS_NO_DATA = "noDataAvailable";
    private previousDataChangeDate?: Date = undefined;
    private tableData?: TableData = undefined;
    private errorArray?: ErrorArray;

    constructor(props: PivotTableWebWidgetContainerProps) {
        super(props);
        this.errorArray = new Data().validateProps(props);
        this.state = {
            lastStateUpdate: undefined
        };
    }

    render(): ReactNode {
        const { dataChangeDateAttr, dataSourceType, ds, serviceUrl } = this.props;

        if (this.errorArray && this.errorArray.length > 0) {
            return this.renderErrors();
        }

        // If something is not (yet) available, render what we got from a previous render.
        if (dataChangeDateAttr?.status !== ValueStatus.Available) {
            if (this.props.logToConsole) {
                this.logMessageToConsole("render: dataChangeDateAttr not yet available");
            }
            return this.renderTable();
        }
        switch (dataSourceType) {
            case "datasource":
                // Do not check for ds status here. If it is loading, we render current data, if any, this prevents flickering.
                if (!ds?.items) {
                    if (this.props.logToConsole) {
                        this.logMessageToConsole("render: ds not yet available");
                    }
                    return this.renderTable();
                }
                break;

            case "serviceCall":
                if (serviceUrl?.status !== ValueStatus.Available) {
                    if (this.props.logToConsole) {
                        this.logMessageToConsole("render: service URL not yet available");
                    }
                    return this.renderTable();
                }
                break;

            default:
                return this.renderTable();
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

        const className = this.CLASS_WIDGET + " " + this.CLASS_CONFIG_ERRORS + " " + this.props.class;
        return (
            <div className={className}>
                <h3>Pivot table widget {this.props.name} has configuration errors</h3>
                <ul>
                    {this.errorArray &&
                        this.errorArray.map((item: string, index) => {
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

        const className = this.CLASS_WIDGET + " " + this.props.class;
        if (this.tableData) {
            if (this.tableData.bodyRows.length > 0) {
                return (
                    <div className={className}>
                        <table>
                            <thead>
                                <tr>{this.tableData.headerRow.cells.map(cell => this.renderCell(cell))}</tr>
                            </thead>
                            <tbody>{this.tableData.bodyRows.map(row => this.renderTableRow(row))}</tbody>
                        </table>
                    </div>
                );
            } else {
                return (
                    <div className={className}>
                        <span className={this.CLASS_NO_DATA}>{this.props.noDataText}</span>
                    </div>
                );
            }
        } else {
            return <div className={className}></div>;
        }
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
                this.getDataFromDatasource();
                break;

            case "serviceCall":
                this.getDataFromService();
                break;
        }
        if (this.props.logToConsole) {
            this.logMessageToConsole("getData end");
        }
    }

    getDataFromDatasource(): void {
        if (this.props.logToConsole) {
            this.logMessageToConsole("getDataFromDatasource");
        }

        const data = new Data();
        data.getDataFromDatasource(this.props);

        const { modelData } = data;
        if (modelData.errorArray && modelData.errorArray.length > 0) {
            this.errorArray = modelData.errorArray;
            this.tableData = undefined;
            if (this.props.logToConsole) {
                this.logMessageToConsole("getDataFromDatasource: Error(s) occurred while getting the data, change the state to force render.");
            }
            this.setState({
                lastStateUpdate: new Date()
            });
        } else {
            this.tableData = modelData.tableData;
        }
    }

    getDataFromService(): void {
        if (this.props.logToConsole) {
            this.logMessageToConsole("getDataFromService");
        }
        const data = new Data();
        data.getDataFromService(this.props).then(() => {
            const { modelData } = data;
            if (modelData.errorArray && modelData.errorArray.length > 0) {
                this.errorArray = modelData.errorArray;
            } else {
                this.tableData = undefined;
                this.tableData = modelData.tableData;
            }
            if (this.props.logToConsole) {
                this.logMessageToConsole("getDataFromService: Received data from service, change the state to force render.");
            }
            this.setState({
                lastStateUpdate: new Date()
            });
        });
    }

    logMessageToConsole(message: string): void {
        console.info(this.props.name + new Date().toISOString() + " (widget) " + message);
    }

    logErrorToConsole(message: string): void {
        console.error(this.props.name + new Date().toISOString() + " (widget) " + message);
    }
}
