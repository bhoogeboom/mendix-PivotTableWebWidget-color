import { Component, ReactNode, createElement, SyntheticEvent } from "react";
import { PivotTableWebWidgetContainerProps } from "../typings/PivotTableWebWidgetProps";
import { ValueStatus } from "mendix";
import { ErrorArray, TableCellData, TableData, TableRowData, ValueDataType } from "./types/CustomTypes";

import "./ui/PivotTableWebWidget.css";
import Data from "./classes/Data";

export default class PivotTableWebWidget extends Component<PivotTableWebWidgetContainerProps> {
    private CLASS_WIDGET = "pivotTableWidget";
    private CLASS_CELL_CLICKABLE = "clickable";
    private CLASS_CONFIG_ERRORS = "configurationErrors";
    private CLASS_NO_DATA = "noDataAvailable";
    private previousDataChangeDate?: Date = undefined;
    private tableData?: TableData = undefined;
    private valueDataType: ValueDataType = "number";
    private errorArray?: ErrorArray;

    constructor(props: PivotTableWebWidgetContainerProps) {
        super(props);
        this.errorArray = new Data().validateProps(props);
        this.state = {
            lastStateUpdate: undefined
        };
        this.onClick = this.onClick.bind(this);
        this.onClickExportButton = this.onClickExportButton.bind(this);
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

    private renderErrors(): ReactNode {
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

    private renderTable(): ReactNode {
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
                            {this.renderTableFooter()}
                        </table>
                    </div>
                );
            } else {
                return (
                    <div className={className}>
                        <span className={this.CLASS_NO_DATA}>{this.props.noDataText.value}</span>
                    </div>
                );
            }
        } else {
            return <div className={className}></div>;
        }
    }

    private renderTableRow(rowData: TableRowData): ReactNode {
        const rowKey = "tr_" + rowData.cells[0].idValueY;
        return <tr key={rowKey}>{rowData.cells.map(item => this.renderCell(item))}</tr>;
    }

    private renderTableFooter(): ReactNode {
        if (!this.props.showTotalRow || !this.tableData?.footerRow) {
            return null;
        }
        const { footerRow } = this.tableData;
        return (
            <tfoot>
                <tr>{footerRow.cells.map(item => this.renderCell(item))}</tr>
            </tfoot>
        );
    }

    private renderCell(cell: TableCellData): ReactNode {
        switch (cell.cellType) {
            case "ColumnHeader":
                const colKey = "x_" + cell.idValueX;
                return (
                    <th key={colKey} className={cell.classes}>
                        <div>
                            <span>{cell.cellValue}</span>
                        </div>
                    </th>
                );
            case "RowHeader":
                const rowKey = "y_" + cell.idValueY;
                return (
                    <th key={rowKey} className={cell.classes}>
                        <span>{cell.cellValue}</span>
                    </th>
                );

            case "EmptyTopLeft":
                return <th key="TL" className={cell.classes} />;

            case "ExportButton":
                return (
                    <th key="TL_Export" className={cell.classes}>
                        {this.renderExportButton()}
                    </th>
                );

            case "ColumnTotal":
                const colTotalKey = "tx_" + cell.idValueX;
                return (
                    <td key={colTotalKey} className={cell.classes}>
                        <span>{cell.cellValue}</span>
                    </td>
                );

            case "RowTotal":
                const rowTotalKey = "ty_" + cell.idValueY;
                return (
                    <td key={rowTotalKey} className={cell.classes}>
                        <span>{cell.cellValue}</span>
                    </td>
                );

            case "RowColumnTotal":
                return (
                    <td key="txy" className={cell.classes}>
                        {cell.cellValue}
                    </td>
                );

            default:
                const cellKey = "c_" + cell.idValueY + cell.idValueX;
                return (
                    <td key={cellKey} className={this.getCellClasses(cell)} onClick={e => this.onClick(e, cell)}>
                        {cell.cellValue}
                    </td>
                );
        }
    }

    onClick(e: SyntheticEvent, cell: TableCellData): void {
        if (this.props.logToConsole) {
            this.logMessageToConsole("onClick: Handle click on X: " + cell.idValueX + ", Y: " + cell.idValueY);
        }

        const { onClickAction, onCellClickXIdAttr, onCellClickYIdAttr } = this.props;
        e.preventDefault();

        if (onClickAction && onClickAction.canExecute && !onClickAction.isExecuting) {
            const idValueX = cell.idValueX ? cell.idValueX : "";
            if (onCellClickXIdAttr) {
                onCellClickXIdAttr.setTextValue(idValueX);
            }
            const idValueY = cell.idValueY ? cell.idValueY : "";
            if (onCellClickYIdAttr) {
                onCellClickYIdAttr.setTextValue(idValueY);
            }
            onClickAction.execute();
        }
    }

    private renderExportButton(): ReactNode {
        const { exportButtonCaption, exportButtonClass } = this.props;
        const className = "btn mx-button " + exportButtonClass;
        return (
            <button className={className} onClick={this.onClickExportButton}>
                {exportButtonCaption.value}
            </button>
        );
    }

    onClickExportButton(): void {
        if (this.props.logToConsole) {
            this.logMessageToConsole("onClickExportButton called");
        }

        if (!this.tableData) {
            if (this.props.logToConsole) {
                this.logMessageToConsole("onClickExportButton: No table data");
            }
            return;
        }

        const { exportFilenamePrefix, exportFilenameDateformat, exportDataAttr, exportFilenameAttr, exportAction } = this.props;
        const { headerRow, bodyRows, footerRow } = this.tableData;

        if (exportDataAttr && exportFilenameAttr && exportAction && exportAction.canExecute && !exportAction.isExecuting) {
            let exportData = "";

            // Header
            exportData += this.exportRowValues(headerRow);

            // Body
            for (const row of bodyRows) {
                exportData += this.exportRowValues(row);
            }

            // Footer
            if (this.props.showTotalRow && footerRow) {
                exportData += this.exportRowValues(footerRow);
            }

            const dateFormat = exportFilenameDateformat?.value ? exportFilenameDateformat.value : "dd-MM-yyyy HH:mm:ss";
            const dateString = mx.parser.formatValue(new Date(), "datetime", { datePattern: dateFormat });
            const fileName = exportFilenamePrefix + " " + dateString + ".csv";
            exportDataAttr.setValue(exportData);
            exportFilenameAttr.setValue(fileName);
            exportAction.execute();
        }
    }

    private exportRowValues(row: TableRowData): string {
        let result = "";
        let firstCell = true;
        for (const cell of row.cells) {
            if (firstCell) {
                result = this.exportCellValue(cell);
                firstCell = false;
            } else {
                result += ";" + this.exportCellValue(cell);
            }
        }
        result += "\r\n";
        return result;
    }

    private exportCellValue(cell: TableCellData): string {
        switch (cell.cellType) {
            case "EmptyTopLeft":
            case "ExportButton":
                return "";

            case "ColumnHeader":
            case "RowHeader":
                const labelValue = cell.cellValue ? cell.cellValue : "";
                return '"' + labelValue + '"';

            default:
                const cellValue = cell.cellValue ? cell.cellValue : "";
                if (this.valueDataType === "string") {
                    return '"' + cellValue + '"';
                } else {
                    return cellValue;
                }
        }
    }

    private getCellClasses(cell: TableCellData): string {
        const classArray = [cell.classes];

        if (this.props.onClickAction) {
            classArray.push(this.CLASS_CELL_CLICKABLE);
        }

        // The join function will skip null values, easier than dealing with that in the code.
        return classArray.join(" ");
    }

    private getData(): void {
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

    private getDataFromDatasource(): void {
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
            this.valueDataType = data.valueDataType;
        }
    }

    private getDataFromService(): void {
        if (this.props.logToConsole) {
            this.logMessageToConsole("getDataFromService");
        }
        const data = new Data();
        data.getDataFromService(this.props).then(() => {
            const { modelData } = data;
            if (modelData.errorArray && modelData.errorArray.length > 0) {
                this.errorArray = modelData.errorArray;
            } else {
                this.tableData = modelData.tableData;
                this.valueDataType = data.valueDataType;
            }
            if (this.props.logToConsole) {
                this.logMessageToConsole("getDataFromService: Received data from service, change the state to force render.");
            }
            this.setState({
                lastStateUpdate: new Date()
            });
        });
    }

    private logMessageToConsole(message: string): void {
        console.info(this.props.name + " " + new Date().toISOString() + " (widget) " + message);
    }

    private logErrorToConsole(message: string): void {
        console.error(this.props.name + " " + new Date().toISOString() + " (widget) " + message);
    }
}
