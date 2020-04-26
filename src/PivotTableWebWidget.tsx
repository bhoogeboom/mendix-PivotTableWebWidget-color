import { Component, ReactNode, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";
import { hot } from "react-hot-loader/root";
import { PivotTableWebWidgetContainerProps } from "../typings/PivotTableWebWidgetProps";

import "./ui/PivotTableWebWidget.css";

class PivotTableWebWidget extends Component<PivotTableWebWidgetContainerProps> {
    render(): ReactNode {
        return <HelloWorldSample sampleText={this.props.sampleText ? this.props.sampleText : "World"} />;
    }
}

export default hot(PivotTableWebWidget);
