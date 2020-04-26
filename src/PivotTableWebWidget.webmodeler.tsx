import { Component, ReactNode, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";
import { PivotTableWebWidgetPreviewProps } from "../typings/PivotTableWebWidgetProps";

declare function require(name: string): string;

export class preview extends Component<PivotTableWebWidgetPreviewProps> {
    render(): ReactNode {
        return <HelloWorldSample sampleText={this.props.sampleText} />;
    }
}

export function getPreviewCss(): string {
    return require("./ui/PivotTableWebWidget.css");
}
